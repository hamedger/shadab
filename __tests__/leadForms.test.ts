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
  const validInput = {
    userId: 'guest',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '2485551234',
    partySize: 8,
    date: '2026-07-15',
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

  it('rejects party size under 8', () => {
    const result = validateReservation({ ...validInput, partySize: 4 })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/minimum party of 8/i)
  })

  it('rejects party size over 20', () => {
    const result = validateReservation({ ...validInput, partySize: 25 })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/catering/i)
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
