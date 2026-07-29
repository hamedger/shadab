/** Grand opening promo window (YYYY-MM-DD, inclusive, America/Chicago). */
export const GRAND_OPENING_START = '2026-08-25'
export const GRAND_OPENING_END = '2026-08-28'

export const GRAND_OPENING_BUFFET_PRICE_CENTS = 999
export const REGULAR_BUFFET_PRICE_CENTS = 2499

/** Shown as an in-person policy note; not redeemed online. */
export const STUDENT_BUFFET_DISCOUNT_PERCENT = 20

function todayDateString(): string {
  const now = new Date()
  const chicagoNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }))
  const y = chicagoNow.getFullYear()
  const m = String(chicagoNow.getMonth() + 1).padStart(2, '0')
  const d = String(chicagoNow.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isGrandOpeningWindow(dateString: string = todayDateString()): boolean {
  return dateString >= GRAND_OPENING_START && dateString <= GRAND_OPENING_END
}

/** True once the grand opening promo is over — use to hide "coming soon" announcements. */
export function hasGrandOpeningEnded(dateString: string = todayDateString()): boolean {
  return dateString > GRAND_OPENING_END
}

export function getBuffetPriceCents(dateString: string = todayDateString()): number {
  return isGrandOpeningWindow(dateString)
    ? GRAND_OPENING_BUFFET_PRICE_CENTS
    : REGULAR_BUFFET_PRICE_CENTS
}

/**
 * One flat price every day during the grand opening promo, then one flat regular
 * price afterward — kept as weekday/weekend sub-fields only so existing per-location
 * Firestore BuffetConfig overrides (weekdayLunchPrice, etc.) still line up.
 */
export const BUFFET_PRICING = {
  get weekday() {
    const price = getBuffetPriceCents()
    return { lunch: price, dinner: price }
  },
  get weekend() {
    const price = getBuffetPriceCents()
    return { lunch: price, dinner: price }
  },
  children: {
    under5: 0,
    age5to10: 'half' as const,
  },
}

export const BUFFET_HOURS = {
  lunch: { start: '11:00', end: '15:00' },
  dinner: { start: '17:00', end: '21:00' },
}

// 0=Sun, 1=Mon ... 6=Sat — Sunday closed
export const BUFFET_DAYS = [1, 2, 3, 4, 5, 6]

export const RESTAURANT_TIMEZONE = 'America/Chicago'
