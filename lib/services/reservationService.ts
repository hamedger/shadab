import { BUFFET_HOURS } from '../../constants/buffet'

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
export const MAX_ADVANCE_DAYS = 30
export const MIN_RESERVATION_PARTY_SIZE = 1

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
    else if (reservationDate.getDay() === 0) errors.push('The buffet is closed Sundays — please pick another date')
    if (reservationDate > maxDate) errors.push(`Book up to ${MAX_ADVANCE_DAYS} days in advance`)
  }
  if (!input.time.trim()) errors.push('Time is required')
  if (input.partySize < MIN_RESERVATION_PARTY_SIZE) {
    errors.push('Party size must be at least 1')
  }

  return { valid: errors.length === 0, errors }
}

function parseHHmm(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return m === 0 ? `${hour12}:00 ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

const RESERVATION_SLOT_INTERVAL_MINUTES = 15

/** Reservation slots match buffet hours (dinner-only), 15 minutes apart. */
export const RESERVATION_TIME_SLOTS: string[] = (() => {
  const start = parseHHmm(BUFFET_HOURS.dinner.start)
  const end = parseHHmm(BUFFET_HOURS.dinner.end)
  const slots: string[] = []
  for (let m = start; m <= end; m += RESERVATION_SLOT_INTERVAL_MINUTES) {
    slots.push(minutesToLabel(m))
  }
  return slots
})()
