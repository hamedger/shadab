import { GRAND_OPENING_END, GRAND_OPENING_START, isGrandOpeningWindow } from './buffet'

export { GRAND_OPENING_START, GRAND_OPENING_END, isGrandOpeningWindow }

export const GRAND_OPENING_RESERVATION_FEE_CENTS = 999
export const REGULAR_RESERVATION_FEE_CENTS = 1500

/** Daily reservation cap once the grand opening promo ends (no cap during grand opening week). */
export const REGULAR_RESERVATION_DAILY_CAP = 5

export function getReservationFeeCents(dateString: string): number {
  return isGrandOpeningWindow(dateString)
    ? GRAND_OPENING_RESERVATION_FEE_CENTS
    : REGULAR_RESERVATION_FEE_CENTS
}

export function getReservationDailyCap(dateString: string): number | null {
  return isGrandOpeningWindow(dateString) ? null : REGULAR_RESERVATION_DAILY_CAP
}
