import {
  buildWeeklyLocationHours,
  DEFAULT_PICKUP_PREP_BUFFER_MINUTES,
  LOCATION_DINE_IN_HOURS,
  LOCATION_ORDER_FULFILLMENT_HOURS,
  RESTAURANT_CITY,
  RESTAURANT_PHONE,
  RESTAURANT_STATE,
  RESTAURANT_STREET,
  RESTAURANT_WEBSITE,
  RESTAURANT_ZIP,
} from './config'
import { Location } from '../types/location'

export const STATIC_LOCATIONS: Location[] = [
  {
    id: 'chicago-il',
    name: 'Shadab — Chicago',
    address: {
      street: RESTAURANT_STREET,
      city: RESTAURANT_CITY,
      state: RESTAURANT_STATE,
      zip: RESTAURANT_ZIP,
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
