import { getFunctions, httpsCallable } from 'firebase/functions'
import app, { auth } from '../firebase'
import { getApiUrl } from '../../constants/api'
import type { BuffetMeal } from '../../constants/buffetSchedule'

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
