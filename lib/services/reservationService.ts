import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import { DEFAULT_LOCATION_ID } from '../../constants/config'

export interface ReservationInput {
  userId: string
  name: string
  email: string
  phone: string
  partySize: number
  date: string
  time: string
  occasion?: string
  specialRequests?: string
  locationId?: string
}

export interface ReservationValidationResult {
  valid: boolean
  errors: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_ADVANCE_DAYS = 30
export const MIN_RESERVATION_PARTY_SIZE = 8
const MAX_PARTY_SIZE = 20

export function validateReservation(input: ReservationInput): ReservationValidationResult {
  const errors: string[] = []

  if (!input.name.trim()) errors.push('Name is required')
  if (!input.email.trim() || !EMAIL_RE.test(input.email.trim())) errors.push('Valid email is required')
  if (!input.phone.trim() || input.phone.replace(/\D/g, '').length < 10) {
    errors.push('Valid phone number is required')
  }
  if (!input.date.trim() || !DATE_RE.test(input.date.trim())) {
    errors.push('Date must be YYYY-MM-DD')
  } else {
    const reservationDate = new Date(`${input.date}T12:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS)

    if (reservationDate < today) errors.push('Date cannot be in the past')
    if (reservationDate > maxDate) errors.push(`Book up to ${MAX_ADVANCE_DAYS} days in advance`)
  }
  if (!input.time.trim()) errors.push('Time is required')
  if (input.partySize < MIN_RESERVATION_PARTY_SIZE) {
    errors.push(`Table reservations require a minimum party of ${MIN_RESERVATION_PARTY_SIZE}`)
  }
  if (input.partySize > MAX_PARTY_SIZE) {
    errors.push(`For parties over ${MAX_PARTY_SIZE}, use the catering inquiry form`)
  }

  return { valid: errors.length === 0, errors }
}

export const RESERVATION_TIME_SLOTS = [
  '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM',
  '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM',
] as const

export async function submitReservation(input: ReservationInput): Promise<string> {
  const validation = validateReservation(input)
  if (!validation.valid) {
    throw new Error(validation.errors[0])
  }

  if (!isFirebaseConfigured) {
    await new Promise((r) => setTimeout(r, 600))
    return `demo-reservation-${Date.now()}`
  }

  const docRef = await addDoc(collection(db, 'reservations'), {
    userId: input.userId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    partySize: input.partySize,
    date: input.date.trim(),
    time: input.time.trim(),
    occasion: input.occasion?.trim() ?? '',
    specialRequests: input.specialRequests?.trim() ?? '',
    locationId: input.locationId ?? DEFAULT_LOCATION_ID,
    status: 'pending',
    createdAt: serverTimestamp(),
  })

  return docRef.id
}
