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

/** Plain-language cancellation policy shown before payment and in admin. */
export const CANCELLATION_POLICY_TEXT = `Free cancellation up to 48 hours before your reservation. Cancellations within 48 hours are charged a 20% fee; the rest is refunded. To cancel, call us at ${formatPhoneDisplay(RESTAURANT_PHONE)}.`
