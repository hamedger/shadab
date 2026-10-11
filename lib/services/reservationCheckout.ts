import { getFunctions, httpsCallable } from 'firebase/functions'
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import app, { auth, db } from '../firebase'
import { getApiUrl } from '../../constants/api'
import {
  BuffetMeal,
  getReservationStartMs,
  getReservationSubtotalCents,
  getReservationTaxCents,
} from '../../constants/buffetSchedule'
import type { ReservationInput } from './reservationService'

export interface ReservationCheckoutInput {
  meal: BuffetMeal
  adults: number
  children: number
  infants: number
  date: string
  time: string
  occasion?: string
  specialRequests?: string
  locationId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
}

export interface ReservationCheckoutResult {
  reservationId: string
  feeCents: number
  href: string
  checkoutSessionId: string
  expirationTime?: number
}

export async function startReservationCheckout(
  input: ReservationCheckoutInput,
): Promise<ReservationCheckoutResult> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Must be signed in to reserve a table.')
  }

  const token = await user.getIdToken()
  const response = await fetch(`${getApiUrl()}/api/reservations/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })

  const payload = (await response.json().catch(() => ({}))) as ReservationCheckoutResult & {
    error?: string
  }

  if (!response.ok) {
    throw new Error(payload.error ?? `Reservation checkout failed (${response.status})`)
  }

  if (!payload.href || !payload.reservationId) {
    throw new Error('Payment server returned an invalid checkout session.')
  }

  return payload
}

export interface ConfirmedCloverReservation {
  reservationId: string
  status: string
  date: string
  time: string
  partySize: number
  feeCents: number
}

export async function confirmCloverReservationAfterRedirect(
  checkoutSessionId: string,
  reservationId?: string,
): Promise<ConfirmedCloverReservation | null> {
  const user = auth.currentUser
  if (!user) return null

  const functions = getFunctions(app, 'us-central1')
  const confirm = httpsCallable(functions, 'confirmCloverReservation')
  const result = await confirm({
    checkoutSessionId,
    ...(reservationId?.trim() ? { reservationId: reservationId.trim() } : {}),
  })
  return result.data as ConfirmedCloverReservation
}

export interface PayAtRestaurantReservation {
  id: string
  meal: BuffetMeal
  date: string
  time: string
  partySize: number
  adults: number
  children: number
  infants: number
  estimatedTotalCents: number
}

/**
 * Books a table with no online payment (prepayment switched off). Written straight to Firestore;
 * the rules only accept this shape for the signed-in user, already confirmed.
 */
export async function createPayAtRestaurantReservation(
  input: ReservationInput & { meal: BuffetMeal; locationId: string },
): Promise<PayAtRestaurantReservation> {
  const guests = { adults: input.adults, children: input.children, infants: input.infants }
  const subtotalCents = getReservationSubtotalCents(input.date, input.meal, guests)
  const taxCents = getReservationTaxCents(subtotalCents)
  const estimatedTotalCents = subtotalCents + taxCents
  const partySize = guests.adults + guests.children + guests.infants
  const startsAtMs = getReservationStartMs(input.date, input.meal, input.time)
  if (startsAtMs === null) throw new Error('Choose a seating time for the selected meal')

  const ref = doc(collection(db, 'reservations'))
  await setDoc(ref, {
    id: ref.id,
    userId: input.userId,
    name: input.name.trim(),
    ...(input.email?.trim() ? { email: input.email.trim().toLowerCase() } : {}),
    phone: input.phone.trim(),
    partySize,
    meal: input.meal,
    adults: guests.adults,
    children: guests.children,
    infants: guests.infants,
    date: input.date,
    time: input.time,
    startsAtMs,
    locationId: input.locationId,
    status: 'confirmed',
    paymentMethod: 'pay_at_restaurant',
    subtotalCents,
    taxCents,
    estimatedTotalCents,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    id: ref.id,
    meal: input.meal,
    date: input.date,
    time: input.time,
    partySize,
    ...guests,
    estimatedTotalCents,
  }
}
