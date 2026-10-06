import { format, parse } from 'date-fns'
import { Linking, Platform } from 'react-native'
import {
  DEFAULT_LOCATION_ID,
  DEFAULT_PICKUP_PREP_BUFFER_MINUTES,
  isOpen24Hours,
  LOCATION_DINE_IN_HOURS,
  LOCATION_ORDER_FULFILLMENT_HOURS,
} from '../constants/config'
import { STATIC_LOCATIONS } from '../constants/staticLocations'
import { Location, LocationAddress, LocationHours, OrderFulfillmentHours } from '../types/location'

/** Minutes before earliest same-day pickup slot for a store. */
export function getPickupPrepBufferMinutes(location: Location | null | undefined): number {
  const minutes = location?.pickupPrepBufferMinutes
  if (typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0) {
    return Math.round(minutes)
  }
  return DEFAULT_PICKUP_PREP_BUFFER_MINUTES
}

function formatHourMinuteLabel(hhmm: string): string {
  const parsed = parse(hhmm, 'HH:mm', new Date())
  return format(parsed, 'h:mm a')
}

export function formatDineInHoursLabel(hours: LocationHours): string {
  if (isOpen24Hours(hours)) return 'Open 24 Hours · Every Day'
  return `Open Daily · ${formatHourMinuteLabel(hours.open)} – ${formatHourMinuteLabel(hours.close)}`
}

/** Dine-in hours for a store. */
export function getLocationDineInHours(
  location: Location | null | undefined,
): LocationHours {
  const representative = location?.hours?.[1] ?? location?.hours?.[0]
  if (representative?.open && representative?.close) {
    return representative
  }

  const locationId = location?.id ? normalizeLocationId(location.id) : DEFAULT_LOCATION_ID
  const hours = LOCATION_DINE_IN_HOURS[locationId]
  if (hours) return { ...hours }

  return { ...LOCATION_DINE_IN_HOURS[DEFAULT_LOCATION_ID] }
}

/** Pickup/delivery scheduling window for a store. */
export function getOrderFulfillmentHours(
  location: Location | null | undefined,
): OrderFulfillmentHours {
  if (location?.fulfillmentHours?.open && location?.fulfillmentHours?.close) {
    return location.fulfillmentHours
  }

  const locationId = location?.id ? normalizeLocationId(location.id) : DEFAULT_LOCATION_ID
  const hours = LOCATION_ORDER_FULFILLMENT_HOURS[locationId]
  if (hours) return { ...hours }

  return { ...LOCATION_ORDER_FULFILLMENT_HOURS[DEFAULT_LOCATION_ID] }
}

/** Firestore doc ids that should merge into canonical static location ids. */
const LOCATION_ID_ALIASES: Record<string, string> = {}

export function normalizeLocationId(id: string): string {
  const key = id.trim().toLowerCase()
  return LOCATION_ID_ALIASES[key] ?? id
}

/** Match Firestore orders written with legacy or canonical location ids. */
export function locationIdsForFirestoreQuery(locationId: string): string[] {
  const normalized = normalizeLocationId(locationId)
  const ids = new Set([normalized])
  return [...ids]
}

function resolveLocationPhone(staticPhone: string, remotePhone?: string): string {
  const remote = remotePhone?.trim()
  if (!remote) return staticPhone
  return remote
}

export function formatLocationAddress(address: LocationAddress): string {
  return `${address.street}, ${address.city}, ${address.state} ${address.zip}`
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (national.length === 10) {
    return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`
  }
  return phone
}

export function getGoogleMapsDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

export function openDirections(address: string): void {
  const url = getGoogleMapsDirectionsUrl(address)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  Linking.openURL(url)
}

export function openPhone(phone: string): void {
  Linking.openURL(`tel:${phone}`)
}

export function formatLocationShort(location: Location): string {
  const dash = location.name.indexOf('—')
  if (dash >= 0) return location.name.slice(dash + 1).trim()
  return location.address.city
}

/** Resolve a display label for an order's locationId (handles legacy ids and missing Firestore docs). */
export function resolveOrderLocationLabel(
  locationId: string | undefined | null,
  locations: Location[] = STATIC_LOCATIONS,
): string {
  const raw = String(locationId ?? '').trim()
  if (!raw) return 'Unknown location'

  const normalized = normalizeLocationId(raw)
  const match =
    locations.find((l) => l.id === normalized || normalizeLocationId(l.id) === normalized) ??
    STATIC_LOCATIONS.find((l) => l.id === normalized)

  if (match) return formatLocationShort(match)

  return normalized
    .split('-')
    .slice(0, -1)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || normalized
}

export function slugifyLocationId(name: string, city: string, state: string): string {
  const base = `${city}-${state}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return base || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function isLocationActive(location: Location): boolean {
  return location.isActive !== false
}

/** Keep all static pickable locations; overlay Firestore fields when present. */
export function mergePickableLocations(remote: Location[]): Location[] {
  const byId = new Map<string, Location>()

  for (const loc of STATIC_LOCATIONS.filter(isLocationActive)) {
    byId.set(loc.id, loc)
  }

  for (const loc of remote.filter(isLocationActive)) {
    const canonicalId = normalizeLocationId(loc.id)
    const base = byId.get(canonicalId)
    const remoteLoc = canonicalId === loc.id ? loc : { ...loc, id: canonicalId }
    byId.set(
      canonicalId,
      base
        ? {
            ...base,
            ...remoteLoc,
            phone: resolveLocationPhone(base.phone, remoteLoc.phone),
            pickupPrepBufferMinutes:
              remoteLoc.pickupPrepBufferMinutes ?? base.pickupPrepBufferMinutes,
          }
        : remoteLoc,
    )
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Admin + settings: merge Firestore locations with static fallbacks so all stores stay visible. */
export function mergeAllLocations(remote: Location[]): Location[] {
  const byId = new Map<string, Location>()

  for (const loc of STATIC_LOCATIONS) {
    byId.set(loc.id, loc)
  }

  for (const loc of remote) {
    const canonicalId = normalizeLocationId(loc.id)
    const base = byId.get(canonicalId)
    const remoteLoc = canonicalId === loc.id ? loc : { ...loc, id: canonicalId }
    byId.set(
      canonicalId,
      base
        ? {
            ...base,
            ...remoteLoc,
            phone: resolveLocationPhone(base.phone, remoteLoc.phone),
            pickupPrepBufferMinutes:
              remoteLoc.pickupPrepBufferMinutes ?? base.pickupPrepBufferMinutes,
          }
        : remoteLoc,
    )
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}
