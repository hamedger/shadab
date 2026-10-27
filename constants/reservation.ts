export {
  CHILD_HALF_PRICE_AGES,
  FREE_CANCELLATION_HOURS,
  getCancellationTerms,
  getReservationPartySize,
  getReservationSlots,
  getReservationStartMs,
  getReservationSubtotalCents,
  getReservationTaxCents,
  getReservationTotalCents,
  hasReservationNotice,
  GRAND_OPENING_END,
  GRAND_OPENING_START,
  isGrandOpeningWindow,
  isMealServedOn,
  LATE_CANCELLATION_FEE_PERCENT,
  RESERVATION_MIN_NOTICE_LABEL,
  RESTAURANT_TAX_RATE,
} from './buffetSchedule'
import { RESTAURANT_PHONE } from './config'
import { formatPhoneDisplay } from '../lib/locationUtils'
export type { BuffetMeal, ReservationGuests } from './buffetSchedule'

/**
 * Off while Clover isn't available: reservations are booked free and paid at the restaurant.
 * Flip to true to send guests through Clover Hosted Checkout again (server + webhook still in place).
 */
export const RESERVATION_PREPAYMENT_ENABLED = false

/** Shown on the reservation form and confirmation when nothing is charged online. */
/** How long a table is held past the seating time before it is released. */
export const TABLE_HOLD_MINUTES = 10

export const TABLE_HOLD_TEXT = `We hold your table for ${TABLE_HOLD_MINUTES} minutes past your seating time.`

export const PAY_AT_RESTAURANT_POLICY_TEXT = `No payment needed now — pay for your buffet at the restaurant. ${TABLE_HOLD_TEXT} Need to cancel or change? Call us at ${formatPhoneDisplay(RESTAURANT_PHONE)}.`

/** Parties this size or larger have a gratuity added to the bill at the restaurant (not in online totals). */
export const LARGE_PARTY_GRATUITY_MIN_GUESTS = 4
export const LARGE_PARTY_GRATUITY_PERCENT = 15
export const LARGE_PARTY_GRATUITY_TEXT = `A ${LARGE_PARTY_GRATUITY_PERCENT}% gratuity is added for parties of ${LARGE_PARTY_GRATUITY_MIN_GUESTS} or more guests.`

/** Plain-language cancellation policy shown before payment and in admin. */
export const CANCELLATION_POLICY_TEXT = `Free cancellation up to 48 hours before your reservation. Cancellations within 48 hours are charged a 20% fee; the rest is refunded. To cancel, call us at ${formatPhoneDisplay(RESTAURANT_PHONE)}.`
