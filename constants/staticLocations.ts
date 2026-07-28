import {
  buildWeeklyLocationHours,
  DEFAULT_PICKUP_PREP_BUFFER_MINUTES,
  LOCATION_DINE_IN_HOURS,
  LOCATION_ORDER_FULFILLMENT_HOURS,
  RESTAURANT_PHONE,
  RESTAURANT_WEBSITE,
} from './config'
import { Location } from '../types/location'

// TODO: replace with the real street address once confirmed
export const STATIC_LOCATIONS: Location[] = [
  {
    id: 'chicago-il',
    name: 'Shadab — Chicago',
    address: {
      street: 'Address coming soon',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'US',
    },
    phone: RESTAURANT_PHONE,
    website: RESTAURANT_WEBSITE,
    hours: buildWeeklyLocationHours(
      LOCATION_DINE_IN_HOURS['chicago-il'].open,
      LOCATION_DINE_IN_HOURS['chicago-il'].close,
    ),
    fulfillmentHours: { ...LOCATION_ORDER_FULFILLMENT_HOURS['chicago-il'] },
    isActive: true,
    acceptsDelivery: true,
    acceptsPickup: true,
    acceptsReservations: true,
    acceptsCatering: true,
    deliveryRadius: 10,
    timezone: 'America/Chicago',
    pickupPrepBufferMinutes: DEFAULT_PICKUP_PREP_BUFFER_MINUTES,
  },
]

export const STATIC_LOCATION_IDS = STATIC_LOCATIONS.map((l) => l.id)
