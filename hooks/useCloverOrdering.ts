import { DEFAULT_LOCATION_ID } from '../constants/config'
import { STATIC_LOCATIONS } from '../constants/staticLocations'
import { usesCloverOnlineOrdering } from '../lib/locationUtils'
import { useLocations } from './useLocations'
import { useSelectedLocation } from './useSelectedLocation'

export interface CloverOrdering {
  /** True when food orders for this location go to Clover Online Ordering. */
  enabled: boolean
  /** That location's Clover Online Ordering URL (set in Admin → Locations). */
  url: string | null
}

/**
 * Clover Online Ordering for the selected location, or the default location when none is
 * picked yet. Driven by the location's `onlineOrderingEnabled` + `onlineOrderingUrl`.
 */
export function useCloverOrdering(): CloverOrdering {
  const { location } = useSelectedLocation()
  const { locations } = useLocations()
  const resolved =
    location ??
    locations.find((l) => l.id === DEFAULT_LOCATION_ID) ??
    STATIC_LOCATIONS.find((l) => l.id === DEFAULT_LOCATION_ID) ??
    null
  return usesCloverOnlineOrdering(resolved)
    ? { enabled: true, url: resolved!.onlineOrderingUrl!.trim() }
    : { enabled: false, url: null }
}
