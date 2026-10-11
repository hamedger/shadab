import { doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import { Reservation, ReservationStatus } from '../../types/reservation'
import {
  addDaysToDateString,
  CancellationTerms,
  getCancellationTerms,
  getReservationStartMs,
  getRestaurantNow,
  getSlotMinutesFromServiceDay,
} from '../../constants/buffetSchedule'

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured')

  await updateDoc(doc(db, 'reservations', id), {
    status,
    updatedAt: serverTimestamp(),
  })
}

function reservationStartMs(r: Pick<Reservation, 'startsAtMs' | 'date' | 'meal' | 'time'>): number {
  if (typeof r.startsAtMs === 'number') return r.startsAtMs
  return getReservationStartMs(r.date, r.meal ?? 'dinner', r.time) ?? Date.now()
}

export function isPayAtRestaurant(r: Pick<Reservation, 'paymentMethod'>): boolean {
  return r.paymentMethod === 'pay_at_restaurant'
}

/** Refund owed if this reservation were cancelled now (only a confirmed prepaid booking has paid). */
export function previewCancellation(r: Reservation, nowMs: number = Date.now()): CancellationTerms {
  const paid = r.status === 'confirmed' && !isPayAtRestaurant(r) ? r.feeCents ?? 0 : 0
  return getCancellationTerms(paid, reservationStartMs(r), nowMs)
}

/**
 * Cancels and records the policy refund: free 48+ hours before seating, else 20% kept.
 * Staff issue the refund itself from the Clover dashboard.
 */
export async function cancelReservationWithPolicy(id: string): Promise<CancellationTerms> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured')

  const ref = doc(db, 'reservations', id)
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Reservation not found')
    const reservation = { id: snap.id, ...snap.data() } as Reservation
    if (reservation.status === 'cancelled') throw new Error('Reservation is already cancelled')
    if (reservation.checkedInAt) throw new Error('Guest already checked in — this reservation was used')

    const terms = previewCancellation(reservation)
    tx.update(ref, {
      status: 'cancelled',
      cancellationFeeCents: terms.feeCents,
      refundCents: terms.refundCents,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return terms
  })
}

/** Short number shown to guests (confirmation email) and searched at the host stand. */
export function formatReservationNumber(id: string): string {
  return id.slice(-6).toUpperCase()
}

/** Dinner runs to 1:00 AM, so until 3:00 AM the host stand is still on the previous day's service. */
export const SERVICE_DAY_ROLLOVER_MINUTES = 3 * 60

export function getCurrentServiceDate(now: Date = new Date()): string {
  const { dateString, minutes } = getRestaurantNow(now)
  return minutes < SERVICE_DAY_ROLLOVER_MINUTES ? addDaysToDateString(dateString, -1) : dateString
}

/** Minutes after midnight of the service day, so 12:30 AM dinner seatings sort after 11:45 PM. */
export function getReservationSortMinutes(r: Pick<Reservation, 'meal' | 'time'>): number {
  return getSlotMinutesFromServiceDay(r.meal ?? 'dinner', r.time) ?? Number.MAX_SAFE_INTEGER
}

/** Matches reservation number (with or without #), guest name, phone digits, or email. */
export function matchesReservationSearch(
  r: Pick<Reservation, 'id' | 'name' | 'phone' | 'email'>,
  rawQuery: string,
): boolean {
  const q = rawQuery.trim().toLowerCase().replace(/^#/, '')
  if (!q) return true
  if (formatReservationNumber(r.id).toLowerCase().includes(q)) return true
  if (r.name?.toLowerCase().includes(q)) return true
  if (r.email?.toLowerCase().includes(q)) return true
  const digits = q.replace(/\D/g, '')
  if (digits.length >= 4 && r.phone?.replace(/\D/g, '').includes(digits)) return true
  return false
}

/** Marks a paid reservation as arrived. Fails if unpaid, cancelled, or already checked in. */
export async function checkInReservation(id: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured')

  const ref = doc(db, 'reservations', id)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Reservation not found')
    const reservation = snap.data() as Reservation
    if (reservation.status === 'cancelled') throw new Error('This reservation was cancelled')
    if (reservation.status !== 'confirmed') throw new Error('Not paid — this reservation is still pending')
    if (reservation.checkedInAt) {
      const at = reservation.checkedInAt.toDate().toLocaleTimeString('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric',
        minute: '2-digit',
      })
      throw new Error(`Already checked in at ${at}`)
    }
    tx.update(ref, { checkedInAt: serverTimestamp(), updatedAt: serverTimestamp() })
  })
}
