import { GRAND_OPENING_END, GRAND_OPENING_START, isGrandOpeningWindow } from './buffet'

export { GRAND_OPENING_START, GRAND_OPENING_END, isGrandOpeningWindow }

/** Per-guest, grand opening week only. */
export const GRAND_OPENING_RESERVATION_FEE_PER_GUEST_CENTS = 999
/** Flat per-table fee once the grand opening promo ends, regardless of party size. */
export const REGULAR_RESERVATION_FEE_CENTS = 1500

/** Daily reservation cap once the grand opening promo ends (no cap during grand opening week). */
export const REGULAR_RESERVATION_DAILY_CAP = 5

/** Aug 25-28: number of guests x $9.99. After: flat $15/table regardless of party size. */
export function getReservationFeeCents(dateString: string, partySize: number): number {
  return isGrandOpeningWindow(dateString)
    ? GRAND_OPENING_RESERVATION_FEE_PER_GUEST_CENTS * Math.max(1, partySize)
    : REGULAR_RESERVATION_FEE_CENTS
}

export function getReservationDailyCap(dateString: string): number | null {
  return isGrandOpeningWindow(dateString) ? null : REGULAR_RESERVATION_DAILY_CAP
}
