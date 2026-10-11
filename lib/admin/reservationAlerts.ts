import { BUFFET_MEALS } from '../../constants/buffetSchedule'
import { Reservation, ReservationStatus } from '../../types/reservation'

export interface ReservationAlertSnapshot {
  status: ReservationStatus
}

export function snapshotReservationForAlerts(r: Pick<Reservation, 'status'>): ReservationAlertSnapshot {
  return { status: r.status }
}

/**
 * Alert once a reservation is confirmed: a brand-new pay-at-restaurant booking (no previous
 * snapshot, after the listener has seeded), or a prepaid one moving from pending to confirmed.
 */
export function shouldAlertForNewReservation(
  previous: ReservationAlertSnapshot | undefined,
  current: Pick<Reservation, 'status'>,
): boolean {
  if (current.status !== 'confirmed') return false
  return !previous || previous.status === 'pending'
}

export function formatReservationAlertTitle(r: Pick<Reservation, 'id'>): string {
  return `New Reservation #${r.id.slice(-6).toUpperCase()}`
}

export function formatReservationAlertBody(
  r: Pick<Reservation, 'name' | 'partySize' | 'meal' | 'date' | 'time'>,
): string {
  const meal = BUFFET_MEALS[r.meal ?? 'dinner'].label
  return `${r.name.trim()} · Party of ${r.partySize} · ${meal} ${r.date} at ${r.time}`
}

export function showBrowserReservationNotification(r: Reservation): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'granted') return null

  return new Notification(formatReservationAlertTitle(r), {
    body: formatReservationAlertBody(r),
    tag: `reservation-${r.id}`,
    requireInteraction: true,
  })
}
