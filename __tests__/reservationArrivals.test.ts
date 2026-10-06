jest.mock('../lib/firebase', () => ({
  isFirebaseConfigured: false,
  db: {},
}))

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(),
  updateDoc: jest.fn(),
}))

import {
  formatReservationNumber,
  getCurrentServiceDate,
  getReservationSortMinutes,
  matchesReservationSearch,
} from '../lib/admin/reservationAdmin'

const reservation = {
  id: 'Zq81kPabc4f2',
  name: 'Jane Doe',
  phone: '(312) 555-0187',
  email: 'jane@example.com',
}

describe('host stand arrivals', () => {
  it('uses the last six characters as the reservation number', () => {
    expect(formatReservationNumber(reservation.id)).toBe('ABC4F2')
  })

  it('finds a guest by reservation number, name, or phone', () => {
    expect(matchesReservationSearch(reservation, '#abc4f2')).toBe(true)
    expect(matchesReservationSearch(reservation, 'ABC4')).toBe(true)
    expect(matchesReservationSearch(reservation, 'doe')).toBe(true)
    expect(matchesReservationSearch(reservation, '555-0187')).toBe(true)
    expect(matchesReservationSearch(reservation, '3125550187')).toBe(true)
    expect(matchesReservationSearch(reservation, 'smith')).toBe(false)
    expect(matchesReservationSearch(reservation, '')).toBe(true)
  })

  it('keeps the previous service day until 3 AM (dinner runs to 1 AM)', () => {
    expect(getCurrentServiceDate(new Date('2026-10-17T00:45:00-05:00'))).toBe('2026-10-16')
    expect(getCurrentServiceDate(new Date('2026-10-17T02:59:00-05:00'))).toBe('2026-10-16')
    expect(getCurrentServiceDate(new Date('2026-10-17T03:00:00-05:00'))).toBe('2026-10-17')
  })

  it('sorts after-midnight dinner seatings after late-evening ones', () => {
    const late = getReservationSortMinutes({ meal: 'dinner', time: '11:45 PM' })
    const afterMidnight = getReservationSortMinutes({ meal: 'dinner', time: '12:30 AM' })
    const breakfast = getReservationSortMinutes({ meal: 'breakfast', time: '7:00 AM' })
    expect(breakfast).toBeLessThan(late)
    expect(afterMidnight).toBeGreaterThan(late)
  })
})
