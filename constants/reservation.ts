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
  GRAND_OPENING_END,
  GRAND_OPENING_START,
  isGrandOpeningWindow,
  isMealServedOn,
  LATE_CANCELLATION_FEE_PERCENT,
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
export const PAY_AT_RESTAURANT_POLICY_TEXT = `No payment needed now — pay for your buffet at the restaurant. Need to cancel or change? Call us at ${formatPhoneDisplay(RESTAURANT_PHONE)}.`

/** Plain-language cancellation policy shown before payment and in admin. */
export const CANCELLATION_POLICY_TEXT = `Free cancellation up to 48 hours before your reservation. Cancellations within 48 hours are charged a 20% fee; the rest is refunded. To cancel, call us at ${formatPhoneDisplay(RESTAURANT_PHONE)}.`
