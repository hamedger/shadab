jest.mock('../lib/firebase', () => ({
  isFirebaseConfigured: false,
  db: {},
}))

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}))

import { validateReservation } from '../lib/services/reservationService'
import { validateCatering } from '../lib/services/cateringService'

describe('reservationService validation', () => {
  // Reservations open with the grand opening (2026-08-25, a Tuesday) — use a date
  // inside that window so this fixture stays valid regardless of when the suite runs.
  const futureDate = '2026-08-26'

  const validInput = {
    userId: 'guest',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '2485551234',
    partySize: 2,
    date: futureDate,
    time: '7:00 PM',
  }

  it('accepts valid reservation input', () => {
    const result = validateReservation(validInput)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing email', () => {
    const result = validateReservation({ ...validInput, email: '' })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/email/i)
  })

  it('rejects a party size under 1', () => {
    const result = validateReservation({ ...validInput, partySize: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/party size/i)
  })

  it('has no upper limit on party size', () => {
    const result = validateReservation({ ...validInput, partySize: 25 })
    expect(result.valid).toBe(true)
  })
})

describe('cateringService validation', () => {
  const validInput = {
    name: 'John Smith',
    email: 'john@example.com',
    phone: '2485559876',
    eventDate: '2026-07-20',
    headcount: 50,
  }

  it('accepts valid catering input', () => {
    const result = validateCatering(validInput)
    expect(result.valid).toBe(true)
  })

  it('rejects headcount under 10', () => {
    const result = validateCatering({ ...validInput, headcount: 5 })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/10 guests/i)
  })
})
