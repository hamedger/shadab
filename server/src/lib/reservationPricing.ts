/** Grand opening promo window (YYYY-MM-DD, inclusive, America/Chicago). Keep in sync with constants/reservation.ts. */
export const GRAND_OPENING_START = '2026-08-25'
export const GRAND_OPENING_END = '2026-08-28'

export const GRAND_OPENING_RESERVATION_FEE_CENTS = 999
export const REGULAR_RESERVATION_FEE_CENTS = 1500

/** Daily reservation cap once the grand opening promo ends (no cap during grand opening week). */
export const REGULAR_RESERVATION_DAILY_CAP = 5

export function isGrandOpeningWindow(dateString: string): boolean {
  return dateString >= GRAND_OPENING_START && dateString <= GRAND_OPENING_END
}

export function getReservationFeeCents(dateString: string): number {
  return isGrandOpeningWindow(dateString)
    ? GRAND_OPENING_RESERVATION_FEE_CENTS
    : REGULAR_RESERVATION_FEE_CENTS
}

export function getReservationDailyCap(dateString: string): number | null {
  return isGrandOpeningWindow(dateString) ? null : REGULAR_RESERVATION_DAILY_CAP
}
