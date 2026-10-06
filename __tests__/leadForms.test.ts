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
  // Pin "now" before opening day so the Oct 16–22 grand opening fixtures stay valid.
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-05T17:00:00Z'))
  })
  afterAll(() => {
    jest.useRealTimers()
  })

  const validInput = {
    userId: 'guest',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '8777423222',
    meal: 'dinner' as const,
    adults: 2,
    children: 1,
    infants: 0,
    date: '2026-10-16',
    time: '7:00 PM',
  }

  it('accepts valid reservation input', () => {
    const result = validateReservation(validInput)
    expect(result.errors).toHaveLength(0)
    expect(result.valid).toBe(true)
  })

  it('rejects missing email', () => {
    const result = validateReservation({ ...validInput, email: '' })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/email/i)
  })

  it('requires a meal', () => {
    const result = validateReservation({ ...validInput, meal: '' })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/breakfast, lunch, or dinner/i)
  })

  it('requires at least one adult', () => {
    const result = validateReservation({ ...validInput, adults: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/adult/i)
  })

  it('rejects a seating time outside the selected meal', () => {
    const result = validateReservation({ ...validInput, meal: 'breakfast', time: '7:00 PM' })
    expect(result.valid).toBe(false)
  })

  it('accepts after-midnight dinner seatings and Sundays', () => {
    expect(validateReservation({ ...validInput, date: '2026-10-18', time: '12:30 AM' }).valid).toBe(true)
  })

  it('rejects breakfast on opening day (dinner starts 6 PM)', () => {
    const result = validateReservation({ ...validInput, date: '2026-10-16', meal: 'breakfast', time: '8:00 AM' })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/opening day/i)
  })

  it('rejects dates before opening day', () => {
    const result = validateReservation({ ...validInput, date: '2026-10-10' })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/open 2026-10-16/)
  })
})

describe('cateringService validation', () => {
  const validInput = {
    name: 'John Smith',
    email: 'john@example.com',
    phone: '2485559876',
    eventDate: '2099-07-20',
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
