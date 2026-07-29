import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../lib/firebase'
import { CloverLineItem } from './cloverClient'
import { getReservationDailyCap, getReservationFeeCents } from '../lib/reservationPricing'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_ADVANCE_DAYS = 30
/** Pending checkouts older than this no longer hold a daily-cap slot (abandoned checkout). */
const PENDING_HOLD_MINUTES = 20

export interface CreatePendingReservationInput {
  cloverMerchantId?: string
  uid: string
  customerEmail: string
  customerName: string
  customerPhone: string
  partySize: number
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

async function countReservationsHoldingCapacity(locationId: string, date: string): Promise<number> {
  const snapshot = await db
    .collection('reservations')
    .where('locationId', '==', locationId)
    .where('date', '==', date)
    .get()

  const cutoffMs = Date.now() - PENDING_HOLD_MINUTES * 60 * 1000
  let count = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (data.status === 'confirmed') {
      count += 1
      continue
    }
    if (isUnpaidPending(data)) {
      const createdAt = data.createdAt?.toDate?.()?.getTime?.() ?? Date.now()
      if (createdAt >= cutoffMs) count += 1
    }
  }

  return count
}

export async function createPendingReservation(
  input: CreatePendingReservationInput,
): Promise<CreatePendingReservationResult> {
  if (!input.customerName.trim()) throw new Error('Name is required')
  if (!input.customerEmail.trim()) throw new Error('Valid email is required')
  const phoneDigits = input.customerPhone.replace(/\D/g, '')
  if (phoneDigits.length < 10) throw new Error('Valid phone number is required')
  if (!DATE_RE.test(input.date)) throw new Error('Date must be YYYY-MM-DD')
  if (!input.time.trim()) throw new Error('Time is required')
  if (!Number.isInteger(input.partySize) || input.partySize < 1) {
    throw new Error('Party size must be at least 1')
  }

  const reservationDate = new Date(`${input.date}T12:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS)
  if (reservationDate < today) throw new Error('Date cannot be in the past')
  if (reservationDate.getDay() === 0) throw new Error('The buffet is closed Sundays — please pick another date')
  if (reservationDate > maxDate) throw new Error(`Book up to ${MAX_ADVANCE_DAYS} days in advance`)

  const dailyCap = getReservationDailyCap(input.date)
  if (dailyCap !== null) {
    const existing = await countReservationsHoldingCapacity(input.locationId, input.date)
    if (existing >= dailyCap) {
      throw new Error(`Fully booked for ${input.date}. Please choose a different date.`)
    }
  }

  const feeCents = getReservationFeeCents(input.date)

  const reservationRef = db.collection('reservations').doc()

  await reservationRef.set({
    id: reservationRef.id,
    userId: input.uid,
    name: input.customerName.trim(),
    email: input.customerEmail.trim().toLowerCase(),
    phone: input.customerPhone.trim(),
    partySize: input.partySize,
    date: input.date,
    time: input.time,
    occasion: input.occasion?.trim() ?? '',
    specialRequests: input.specialRequests?.trim() ?? '',
    locationId: input.locationId,
    status: 'pending',
    feeCents,
    cloverMerchantId: input.cloverMerchantId ?? '',
    cloverCheckoutSessionId: '',
    cloverPaymentId: '',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  const lineItems: CloverLineItem[] = [
    {
      name: `Table Reservation — ${input.partySize} guest${input.partySize === 1 ? '' : 's'}`,
      price: feeCents,
      unitQty: 1,
      note: `${input.date} at ${input.time}`,
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
