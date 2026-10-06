import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../lib/firebase'
import { CloverLineItem } from './cloverClient'
import {
  addDaysToDateString,
  BUFFET_MEALS,
  BuffetMeal,
  getBuffetMealPriceCents,
  getChildBuffetPriceCents,
  getReservationSlots,
  getReservationStartMs,
  getReservationSubtotalCents,
  getReservationTaxCents,
  RESTAURANT_TAX_RATE,
  getRestaurantNow,
  GRAND_OPENING_START,
  isMealServedOn,
} from '../lib/buffetSchedule'

const MAX_PARTY_SIZE = 40
const MEALS: BuffetMeal[] = ['breakfast', 'lunch', 'dinner']

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_ADVANCE_DAYS = 30

export interface CreatePendingReservationInput {
  cloverMerchantId?: string
  uid: string
  customerEmail: string
  customerName: string
  customerPhone: string
  meal: string
  adults: number
  children: number
  infants: number
  date: string
  time: string
  occasion?: string
  specialRequests?: string
  locationId: string
}

export interface CreatePendingReservationResult {
  reservationId: string
  feeCents: number
  lineItems: CloverLineItem[]
  customer: {
    email: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
  }
}

function isUnpaidPending(data: Record<string, unknown>): boolean {
  return data.status === 'pending' && !String(data.cloverPaymentId ?? '').trim()
}

export async function createPendingReservation(
  input: CreatePendingReservationInput,
): Promise<CreatePendingReservationResult> {
  if (!input.customerName.trim()) throw new Error('Name is required')
  if (!input.customerEmail.trim()) throw new Error('Valid email is required')
  const phoneDigits = input.customerPhone.replace(/\D/g, '')
  if (phoneDigits.length < 10) throw new Error('Valid phone number is required')
  if (!DATE_RE.test(input.date)) throw new Error('Date must be YYYY-MM-DD')
  if (!MEALS.includes(input.meal as BuffetMeal)) throw new Error('Meal is required (breakfast, lunch, or dinner)')
  const meal = input.meal as BuffetMeal
  if (!getReservationSlots(meal).includes(input.time.trim())) {
    throw new Error('Time is required and must be a seating time for the selected meal')
  }
  const guests = { adults: input.adults, children: input.children, infants: input.infants }
  if (!Number.isInteger(guests.adults) || guests.adults < 1) throw new Error('Party needs at least 1 adult')
  if (!Number.isInteger(guests.children) || guests.children < 0 || !Number.isInteger(guests.infants) || guests.infants < 0) {
    throw new Error('Party size has an invalid number of children')
  }
  const partySize = guests.adults + guests.children + guests.infants
  if (partySize > MAX_PARTY_SIZE) throw new Error(`Party size over ${MAX_PARTY_SIZE} — please call the restaurant`)

  const today = getRestaurantNow().dateString
  const bookingStart = GRAND_OPENING_START > today ? GRAND_OPENING_START : today
  if (input.date < bookingStart) {
    throw new Error(
      bookingStart > today ? `Table reservations open ${GRAND_OPENING_START}` : 'Date cannot be in the past',
    )
  }
  if (input.date > addDaysToDateString(today, MAX_ADVANCE_DAYS)) {
    throw new Error(`Book up to ${MAX_ADVANCE_DAYS} days in advance`)
  }
  if (!isMealServedOn(input.date, meal)) {
    throw new Error(`Date unavailable: ${BUFFET_MEALS[meal].label} is not served on ${input.date}`)
  }
  const startsAtMs = getReservationStartMs(input.date, meal, input.time.trim())
  if (startsAtMs === null || startsAtMs <= Date.now()) throw new Error('Date and time have already passed')

  // Reservations prepay 100% of the buffet plus tax: adults full price, kids 5–10 half, under 5 free.
  const adultCents = getBuffetMealPriceCents(input.date, meal)
  const childCents = getChildBuffetPriceCents(adultCents)
  const subtotalCents = getReservationSubtotalCents(input.date, meal, guests)
  const taxCents = getReservationTaxCents(subtotalCents)
  const feeCents = subtotalCents + taxCents
  const mealLabel = BUFFET_MEALS[meal].label

  const reservationRef = db.collection('reservations').doc()

  await reservationRef.set({
    id: reservationRef.id,
    userId: input.uid,
    name: input.customerName.trim(),
    email: input.customerEmail.trim().toLowerCase(),
    phone: input.customerPhone.trim(),
    partySize,
    meal,
    adults: guests.adults,
    children: guests.children,
    infants: guests.infants,
    date: input.date,
    time: input.time.trim(),
    startsAtMs,
    occasion: input.occasion?.trim() ?? '',
    specialRequests: input.specialRequests?.trim() ?? '',
    locationId: input.locationId,
    status: 'pending',
    subtotalCents,
    taxCents,
    feeCents,
    cloverMerchantId: input.cloverMerchantId ?? '',
    cloverCheckoutSessionId: '',
    cloverPaymentId: '',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  const note = `${mealLabel} buffet · ${input.date} at ${input.time.trim()}`
  const lineItems: CloverLineItem[] = [
    { name: `${mealLabel} Buffet — Adult`, price: adultCents, unitQty: guests.adults, note },
    ...(guests.children > 0
      ? [{ name: `${mealLabel} Buffet — Child (5–10)`, price: childCents, unitQty: guests.children, note }]
      : []),
    {
      name: `Sales tax (${(RESTAURANT_TAX_RATE * 100).toFixed(2)}%)`,
      price: taxCents,
      unitQty: 1,
    },
  ]

  const [firstName, ...rest] = input.customerName.trim().split(/\s+/)
  const lastName = rest.join(' ')

  return {
    reservationId: reservationRef.id,
    feeCents,
    lineItems,
    customer: {
      email: input.customerEmail.trim(),
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      phoneNumber: input.customerPhone.trim(),
    },
  }
}

export async function cancelUnpaidPendingReservation(reservationId: string, uid: string): Promise<void> {
  const ref = db.collection('reservations').doc(reservationId)
  const snap = await ref.get()
  if (!snap.exists) return
  const data = snap.data()!
  if (data.userId !== uid || !isUnpaidPending(data)) return

  await ref.update({ status: 'cancelled', updatedAt: FieldValue.serverTimestamp() })
}

export async function attachReservationCheckoutSession(reservationId: string, checkoutSessionId: string) {
  await db.collection('reservations').doc(reservationId).update({
    cloverCheckoutSessionId: checkoutSessionId,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function markReservationPaidByCheckoutSession(
  checkoutSessionId: string,
  paymentId: string,
): Promise<string | null> {
  const snapshot = await db
    .collection('reservations')
    .where('cloverCheckoutSessionId', '==', checkoutSessionId)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  const data = doc.data()

  if (data.status === 'cancelled') return null
  if (data.status === 'confirmed') return doc.id

  await doc.ref.update({
    status: 'confirmed',
    cloverPaymentId: paymentId || checkoutSessionId,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return doc.id
}

export async function markReservationDeclinedByCheckoutSession(
  checkoutSessionId: string,
): Promise<string | null> {
  const snapshot = await db
    .collection('reservations')
    .where('cloverCheckoutSessionId', '==', checkoutSessionId)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  if (doc.data().status !== 'pending') return doc.id

  await doc.ref.update({ status: 'cancelled', updatedAt: FieldValue.serverTimestamp() })
  return doc.id
}

