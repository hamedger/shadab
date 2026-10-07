/**
 * Buffet meals, prices, grand opening promo, and reservation pricing/cancellation rules.
 *
 * Dependency-free on purpose: identical copies live in
 *   constants/buffetSchedule.ts (web)
 *   server/src/lib/buffetSchedule.ts (Clover payment server — charges reservations)
 * Edit both together.
 */

export const RESTAURANT_TIMEZONE = 'America/Chicago'

export type BuffetMeal = 'breakfast' | 'lunch' | 'dinner'

export const BUFFET_MEAL_ORDER: BuffetMeal[] = ['breakfast', 'lunch', 'dinner']

export interface BuffetMealConfig {
  label: string
  /** 24h HH:mm, America/Chicago. */
  start: string
  /** 24h HH:mm. An end at or before `start` means the service runs past midnight. */
  end: string
  /** Every day — or Mon–Thu only when `weekend` is set. */
  regularPriceCents: number
  grandOpeningPriceCents: number
  /** Fri–Sun prices, when they differ from Mon–Thu. */
  weekend?: { regularPriceCents: number; grandOpeningPriceCents: number }
}

/** Fri, Sat, Sun (0=Sun … 6=Sat) — "Grand Lunch" days on the flyer. */
export const WEEKEND_BUFFET_DAYS = [5, 6, 0]

/** Served every day, Sunday included. */
export const BUFFET_MEALS: Record<BuffetMeal, BuffetMealConfig> = {
  breakfast: {
    label: 'Breakfast',
    start: '07:00',
    end: '12:30',
    regularPriceCents: 999,
    grandOpeningPriceCents: 999,
  },
  lunch: {
    label: 'Lunch',
    start: '13:30',
    end: '16:00',
    regularPriceCents: 1399,
    grandOpeningPriceCents: 1399,
    weekend: { regularPriceCents: 2499, grandOpeningPriceCents: 1999 },
  },
  dinner: {
    label: 'Dinner',
    start: '18:00',
    end: '01:00',
    regularPriceCents: 2499,
    grandOpeningPriceCents: 1999,
  },
}

/** Grand opening promo week (YYYY-MM-DD, inclusive, America/Chicago). */
export const GRAND_OPENING_START = '2026-10-16'
export const GRAND_OPENING_END = '2026-10-22'
/** Opening day starts with lunch at 1:30 PM — no breakfast that day. */
export const OPENING_DAY_FIRST_MEAL: BuffetMeal = 'lunch'

/** Kids under 5 eat free; kids 5–10 pay half the adult buffet price. */
export const CHILD_FREE_MAX_AGE = 4
export const CHILD_HALF_PRICE_AGES = { min: 5, max: 10 }

/** Reservations are prepaid in full. Free cancellation until this many hours before seating. */
export const FREE_CANCELLATION_HOURS = 48
/** Fee kept when cancelling inside the free-cancellation window. */
export const LATE_CANCELLATION_FEE_PERCENT = 20

const RESERVATION_SLOT_INTERVAL_MINUTES = 15
/** Last seating is this long before a buffet closes. */
const LAST_SEATING_BEFORE_CLOSE_MINUTES = 30

export function parseHHmm(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Start/end as minutes after midnight of the service day; `end` may exceed 1440. */
export function getMealWindowMinutes(meal: BuffetMeal): { start: number; end: number } {
  const start = parseHHmm(BUFFET_MEALS[meal].start)
  let end = parseHHmm(BUFFET_MEALS[meal].end)
  if (end <= start) end += 24 * 60
  return { start, end }
}

export function isGrandOpeningWindow(dateString: string): boolean {
  return dateString >= GRAND_OPENING_START && dateString <= GRAND_OPENING_END
}

export function hasGrandOpeningEnded(dateString: string): boolean {
  return dateString > GRAND_OPENING_END
}

/** False before opening day, and for meals before the first one on opening day. */
export function isMealServedOn(dateString: string, meal: BuffetMeal): boolean {
  if (dateString < GRAND_OPENING_START) return false
  if (dateString === GRAND_OPENING_START) {
    return BUFFET_MEAL_ORDER.indexOf(meal) >= BUFFET_MEAL_ORDER.indexOf(OPENING_DAY_FIRST_MEAL)
  }
  return true
}

/** 0=Sun … 6=Sat for a YYYY-MM-DD date. */
export function getDayOfWeek(dateString: string): number {
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function isWeekendBuffetDay(dateString: string): boolean {
  return WEEKEND_BUFFET_DAYS.includes(getDayOfWeek(dateString))
}

function getMealPrices(dateString: string, meal: BuffetMeal) {
  const config = BUFFET_MEALS[meal]
  return config.weekend && isWeekendBuffetDay(dateString) ? config.weekend : config
}

export function getBuffetMealRegularPriceCents(dateString: string, meal: BuffetMeal): number {
  return getMealPrices(dateString, meal).regularPriceCents
}

export function getBuffetMealPriceCents(dateString: string, meal: BuffetMeal): number {
  const prices = getMealPrices(dateString, meal)
  return isGrandOpeningWindow(dateString) ? prices.grandOpeningPriceCents : prices.regularPriceCents
}

export function getChildBuffetPriceCents(adultPriceCents: number): number {
  return Math.round(adultPriceCents / 2)
}

export interface ReservationGuests {
  adults: number
  /** Ages 5–10, half price. */
  children: number
  /** Under 5, free. */
  infants: number
}

export function getReservationPartySize(guests: ReservationGuests): number {
  return guests.adults + guests.children + guests.infants
}

/**
 * Chicago sales tax on prepared food outside the downtown MPEA district (2311 W Devon Ave):
 * 6.25% state + 1.75% Cook County + 1.25% city + 1% RTA + 0.5% Chicago restaurant tax.
 * Keep in sync with TAX_RATE in lib/services/cartService.ts and server/src/lib/cartTotals.ts.
 */
export const RESTAURANT_TAX_RATE = 0.1075

/** Buffet price for the party before tax: adults full price, kids 5–10 half, under 5 free. */
export function getReservationSubtotalCents(
  dateString: string,
  meal: BuffetMeal,
  guests: ReservationGuests,
): number {
  const adultCents = getBuffetMealPriceCents(dateString, meal)
  return adultCents * guests.adults + getChildBuffetPriceCents(adultCents) * guests.children
}

export function getReservationTaxCents(subtotalCents: number): number {
  return Math.round(subtotalCents * RESTAURANT_TAX_RATE)
}

/** Reservations prepay 100% of the buffet for everyone in the party, plus tax. */
export function getReservationTotalCents(
  dateString: string,
  meal: BuffetMeal,
  guests: ReservationGuests,
): number {
  const subtotal = getReservationSubtotalCents(dateString, meal, guests)
  return subtotal + getReservationTaxCents(subtotal)
}

export function formatMinutesLabel(totalMinutes: number): string {
  const minutes = ((totalMinutes % 1440) + 1440) % 1440
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

/** Parses "6:15 PM" → minutes after midnight (0–1439), or null. */
export function parseSlotLabel(label: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 1 || hour > 12 || minute > 59) return null
  const isPm = match[3].toUpperCase() === 'PM'
  return (hour % 12) * 60 + minute + (isPm ? 12 * 60 : 0)
}

/** Seating times for a meal, 15 minutes apart, ending 30 minutes before close. */
export function getReservationSlots(meal: BuffetMeal): string[] {
  const { start, end } = getMealWindowMinutes(meal)
  const slots: string[] = []
  for (let m = start; m <= end - LAST_SEATING_BEFORE_CLOSE_MINUTES; m += RESERVATION_SLOT_INTERVAL_MINUTES) {
    slots.push(formatMinutesLabel(m))
  }
  return slots
}

/**
 * Minutes after midnight of the reservation date for a slot label. Dinner slots after
 * midnight (e.g. 12:30 AM) belong to the previous evening's service, so they land past 1440.
 */
export function getSlotMinutesFromServiceDay(meal: BuffetMeal, label: string): number | null {
  const minutes = parseSlotLabel(label)
  if (minutes === null) return null
  const { start } = getMealWindowMinutes(meal)
  return minutes < start ? minutes + 24 * 60 : minutes
}

function timeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - utcMs
}

/** UTC epoch ms for `minutes` after midnight of `dateString` in the restaurant timezone. */
export function restaurantLocalToUtcMs(dateString: string, minutes: number): number {
  const [y, mo, d] = dateString.split('-').map(Number)
  const naive = Date.UTC(y, mo - 1, d, 0, 0) + minutes * 60_000
  let utc = naive - timeZoneOffsetMs(naive, RESTAURANT_TIMEZONE)
  // Second pass settles the offset across DST transitions.
  utc = naive - timeZoneOffsetMs(utc, RESTAURANT_TIMEZONE)
  return utc
}

export function getReservationStartMs(dateString: string, meal: BuffetMeal, slotLabel: string): number | null {
  const minutes = getSlotMinutesFromServiceDay(meal, slotLabel)
  return minutes === null ? null : restaurantLocalToUtcMs(dateString, minutes)
}

export interface CancellationTerms {
  isLateCancellation: boolean
  feeCents: number
  refundCents: number
}

/** Free cancellation 48+ hours before seating; otherwise a 20% fee is kept. */
export function getCancellationTerms(paidCents: number, startMs: number, nowMs: number = Date.now()): CancellationTerms {
  const isLateCancellation = startMs - nowMs < FREE_CANCELLATION_HOURS * 60 * 60 * 1000
  const feeCents = isLateCancellation ? Math.round((paidCents * LATE_CANCELLATION_FEE_PERCENT) / 100) : 0
  return { isLateCancellation, feeCents, refundCents: paidCents - feeCents }
}

/** Today's date (YYYY-MM-DD) and minutes after midnight in the restaurant timezone. */
export function getRestaurantNow(now: Date = new Date()): { dateString: string; minutes: number; dayOfWeek: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const dateString = `${get('year')}-${get('month')}-${get('day')}`
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return {
    dateString,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
    dayOfWeek: weekdays.indexOf(get('weekday')),
  }
}

export function addDaysToDateString(dateString: string, days: number): string {
  const [y, m, d] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}
