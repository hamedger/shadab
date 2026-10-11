import {
  BuffetMeal,
  BUFFET_MEALS,
  formatMinutesLabel,
  getMealWindowMinutes,
  getReservationSlots,
  getReservationStartMs,
  getRestaurantNow,
  addDaysToDateString,
  GRAND_OPENING_START,
  isMealServedOn,
  OPENING_DAY_FIRST_MEAL,
} from '../../constants/buffetSchedule'

export interface ReservationInput {
  userId: string
  name: string
  /** Optional — the form only asks for a cell phone. */
  email?: string
  phone: string
  meal: BuffetMeal | ''
  adults: number
  /** Ages 5–10 (half price). */
  children: number
  /** Under 5 (free). */
  infants: number
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
export const MAX_RESERVATION_PARTY_SIZE = 40

function isWholeNumber(n: number, min: number): boolean {
  return Number.isInteger(n) && n >= min
}

export function validateReservation(input: ReservationInput): ReservationValidationResult {
  const errors: string[] = []

  if (!input.name.trim()) errors.push('Name is required')
  if (!input.phone.trim() || input.phone.replace(/\D/g, '').length < 10) {
    errors.push('Valid cell phone number is required')
  }
  if (input.email?.trim() && !EMAIL_RE.test(input.email.trim())) {
    errors.push('Enter a valid email or leave it blank')
  }
  if (!input.meal) errors.push('Choose breakfast, lunch, or dinner')

  if (!input.date.trim() || !DATE_RE.test(input.date.trim())) {
    errors.push('Choose a date')
  } else {
    const today = getRestaurantNow().dateString
    const bookingStart = GRAND_OPENING_START > today ? GRAND_OPENING_START : today
    const maxDate = addDaysToDateString(today, MAX_ADVANCE_DAYS)

    if (input.date < bookingStart) {
      errors.push(
        bookingStart > today ? `Table reservations open ${GRAND_OPENING_START}` : 'Date cannot be in the past',
      )
    } else if (input.date > maxDate) {
      errors.push(`Book up to ${MAX_ADVANCE_DAYS} days in advance`)
    } else if (input.meal && !isMealServedOn(input.date, input.meal)) {
      errors.push(`${BUFFET_MEALS[input.meal].label} isn't served that day — opening day starts with ${OPENING_DAY_FIRST_MEAL} at ${formatMinutesLabel(getMealWindowMinutes(OPENING_DAY_FIRST_MEAL).start)}`)
    }
  }
  if (!input.time.trim()) errors.push('Choose a seating time')
  else if (input.meal && !getReservationSlots(input.meal).includes(input.time)) {
    errors.push('Choose a seating time for the selected meal')
  } else if (input.meal && DATE_RE.test(input.date)) {
    const startMs = getReservationStartMs(input.date, input.meal, input.time)
    if (startMs !== null && startMs <= Date.now()) errors.push('That seating time has already passed')
  }

  if (!isWholeNumber(input.adults, 1)) errors.push('At least 1 adult is required')
  if (!isWholeNumber(input.children, 0) || !isWholeNumber(input.infants, 0)) {
    errors.push('Enter a valid number of children')
  }
  if (input.adults + input.children + input.infants > MAX_RESERVATION_PARTY_SIZE) {
    errors.push(`For parties over ${MAX_RESERVATION_PARTY_SIZE}, please call us or request catering`)
  }

  return { valid: errors.length === 0, errors }
}
