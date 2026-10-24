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
  BUFFET_COMING_SOON_MESSAGE,
  RESERVABLE_MEALS,
  hasReservationNotice,
  RESERVATION_MIN_NOTICE_LABEL,
  getReservationBlockId,
  getReservationSeatsLeft,
  getReservationBlockFullMessage,
} from '../lib/buffetSchedule'

const MAX_PARTY_SIZE = 40

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

/** Gives a booking's seats back to its 90-minute block when it's cancelled. */
function releaseBlockGuests(tx: FirebaseFirestore.Transaction, data: Record<string, unknown>) {
  const blockId = String(data.capacityBlockId ?? '')
  const partySize = Number(data.partySize ?? 0)
  if (!blockId || !partySize) return
  tx.set(db.collection('reservationCapacity').doc(blockId), { guests: FieldValue.increment(-partySize) }, { merge: true })
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
  if (input.meal === 'breakfast' || input.meal === 'lunch') throw new Error(BUFFET_COMING_SOON_MESSAGE)
  if (!RESERVABLE_MEALS.includes(input.meal as BuffetMeal)) throw new Error('Meal is required (dinner)')
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
  if (!hasReservationNotice(startsAtMs)) {
    throw new Error(`Reservations need at least ${RESERVATION_MIN_NOTICE_LABEL}' notice — pick a later time or date`)
  }

  // Reservations prepay 100% of the buffet plus tax: adults full price, kids 4–10 half, under 4 free.
  const adultCents = getBuffetMealPriceCents(input.date, meal)
  const childCents = getChildBuffetPriceCents(adultCents)
  const subtotalCents = getReservationSubtotalCents(input.date, meal, guests)
  const taxCents = getReservationTaxCents(subtotalCents)
  const feeCents = subtotalCents + taxCents
  const mealLabel = BUFFET_MEALS[meal].label

  const capacityBlockId = getReservationBlockId(input.date, meal, input.time.trim())
  if (!capacityBlockId) throw new Error('Time is required and must be a seating time for the selected meal')

  const reservationRef = db.collection('reservations').doc()
  const capacityRef = db.collection('reservationCapacity').doc(capacityBlockId)

  // Seats are held while the guest is in checkout and given back if it's abandoned or declined,
  // so a block never passes 100 guests even when payments land at the same time.
  await db.runTransaction(async (tx) => {
    const capacity = await tx.get(capacityRef)
    const bookedGuests = Number(capacity.data()?.guests ?? 0)
    const seatsLeft = getReservationSeatsLeft(bookedGuests)
    if (partySize > seatsLeft) throw new Error(getReservationBlockFullMessage(seatsLeft))

    tx.set(capacityRef, { guests: bookedGuests + partySize, lastReservationId: reservationRef.id })
    tx.set(reservationRef, {
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
      capacityBlockId,
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
  })

  const note = `${mealLabel} buffet · ${input.date} at ${input.time.trim()}`
  const lineItems: CloverLineItem[] = [
    { name: `${mealLabel} Buffet — Adult`, price: adultCents, unitQty: guests.adults, note },
    ...(guests.children > 0
      ? [{ name: `${mealLabel} Buffet — Child (4–10)`, price: childCents, unitQty: guests.children, note }]
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
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) return
    const data = snap.data()!
    if (data.userId !== uid || !isUnpaidPending(data)) return

    releaseBlockGuests(tx, data)
    tx.update(ref, { status: 'cancelled', updatedAt: FieldValue.serverTimestamp() })
  })
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
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(doc.ref)
    const data = snap.data()
    if (!data || data.status !== 'pending') return

    releaseBlockGuests(tx, data)
    tx.update(doc.ref, { status: 'cancelled', updatedAt: FieldValue.serverTimestamp() })
  })
  return doc.id
}

