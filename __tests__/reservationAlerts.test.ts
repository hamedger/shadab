import {
  formatReservationAlertBody,
  formatReservationAlertTitle,
  shouldAlertForNewReservation,
} from '../lib/admin/reservationAlerts'

describe('reservation alerts', () => {
  it('alerts for a new confirmed (pay-at-restaurant) booking', () => {
    expect(shouldAlertForNewReservation(undefined, { status: 'confirmed' })).toBe(true)
  })

  it('alerts when a prepaid booking moves from pending to confirmed', () => {
    expect(shouldAlertForNewReservation({ status: 'pending' }, { status: 'confirmed' })).toBe(true)
  })

  it('stays quiet for unpaid, cancelled, or already-confirmed bookings', () => {
    expect(shouldAlertForNewReservation(undefined, { status: 'pending' })).toBe(false)
    expect(shouldAlertForNewReservation({ status: 'confirmed' }, { status: 'cancelled' })).toBe(false)
    expect(shouldAlertForNewReservation({ status: 'confirmed' }, { status: 'confirmed' })).toBe(false)
  })

  it('formats the notification', () => {
    const r = { id: 'abcdefxyz123', name: ' Jane Doe ', partySize: 4, meal: 'lunch' as const, date: '2026-10-16', time: '1:30 PM' }
    expect(formatReservationAlertTitle(r)).toBe('New Reservation #XYZ123')
    expect(formatReservationAlertBody(r)).toBe('Jane Doe · Party of 4 · Lunch 2026-10-16 at 1:30 PM')
  })
})
