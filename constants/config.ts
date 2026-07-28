export const APP_NAME = 'Shadab'
export const APP_TAGLINE = 'Authentic Hyderabadi Cuisine'
// TODO: replace with the real Chicago address/phone once confirmed
export const RESTAURANT_PHONE = '+13125550100'
export const RESTAURANT_ADDRESS = 'Address coming soon, Chicago, IL'
export const RESTAURANT_WEBSITE = 'https://www.shadab.com'
export const SUPPORT_EMAIL = 'support@shadab.com'
export const ORDERS_EMAIL = 'orders@shadab.com'
/** Staff inbox for new paid order alerts (Cloud Functions). */
export const ORDERS_NOTIFICATION_EMAIL = 'orders@shadab.com'

export const DEFAULT_LOCATION_ID = 'chicago-il'

type HourRange = { open: string; close: string }

/** Per-location dine-in hours (24h HH:mm), open daily. */
export const LOCATION_DINE_IN_HOURS: Record<string, HourRange> = {
  'chicago-il': { open: '11:30', close: '22:00' },
}

/** Build a 7-day hours map with the same open/close every day. */
export function buildWeeklyLocationHours(
  open: string,
  close: string,
): Record<number, HourRange> {
  return Object.fromEntries(
    Array.from({ length: 7 }, (_, day) => [day, { open, close }]),
  ) as Record<number, HourRange>
}

/** @deprecated Use per-location dine-in hours via `buildWeeklyLocationHours`. */
export const BUSINESS_HOURS = buildWeeklyLocationHours(
  LOCATION_DINE_IN_HOURS[DEFAULT_LOCATION_ID].open,
  LOCATION_DINE_IN_HOURS[DEFAULT_LOCATION_ID].close,
)

/** Per-location pickup/delivery hours (24h HH:mm). */
export const LOCATION_ORDER_FULFILLMENT_HOURS: Record<string, HourRange> = {
  'chicago-il': { open: '11:30', close: '22:00' },
}

/** Max distance self-delivery drivers will travel; beyond this, delivery is declined. */
export const MAX_DELIVERY_RADIUS_MILES = 10
/** Delivery is free up to this distance from the ordering location. */
export const FREE_DELIVERY_RADIUS_MILES = 1
export const DELIVERY_RATE_CENTS_PER_MILE = 100
export const DELIVERY_MINIMUM_SUBTOTAL_CENTS = 2000
/** Fixed daily delivery window (self-delivery drivers), same at every location. */
export const DELIVERY_FULFILLMENT_HOURS = { open: '17:00', close: '23:30' }

/**
 * Self-delivery UI + checkout flow.
 * Off by default in production; set EXPO_PUBLIC_DELIVERY_ENABLED=true in .env for local/staging tests.
 */
export const DELIVERY_ENABLED = process.env.EXPO_PUBLIC_DELIVERY_ENABLED === 'true'

export const LOYALTY = {
  pointsPerDollar: 1,
  pointsToDollar: 100,
  bonus: {
    firstOrder: 100,
    birthday: 2,      // 2x multiplier
    referral: 200,
    review: 25,
    socialShare: 10,
  },
  tiers: {
    bronze: { min: 0, max: 499 },
    silver: { min: 500, max: 1499 },
    gold: { min: 1500, max: 2999 },
    platinum: { min: 3000, max: Infinity },
  },
}

export const DEFAULT_PICKUP_PREP_BUFFER_MINUTES = 30

export const TIMEZONE = 'America/Chicago'
