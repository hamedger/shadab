import { useEffect, useMemo } from 'react'
import { DEFAULT_LOCATION_ID } from '../constants/config'
import { STATIC_LOCATIONS } from '../constants/staticLocations'
import { useLocationStore } from '../store/locationStore'
import { useLocations } from './useLocations'
import { isLocationActive, normalizeLocationId } from '../lib/locationUtils'

const PICKABLE_LOCATIONS = STATIC_LOCATIONS.filter(isLocationActive)

export function useSelectedLocation() {
  const hydrate = useLocationStore((s) => s.hydrate)
  const selectedLocationId = useLocationStore((s) => s.selectedLocationId)
  const hasHydrated = useLocationStore((s) => s.hasHydrated)
  const { locations, loading } = useLocations()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const normalizedSelectedId = selectedLocationId
    ? normalizeLocationId(selectedLocationId)
    : null

  const location = useMemo(() => {
    if (!normalizedSelectedId) return null
    return (
      locations.find((l) => l.id === normalizedSelectedId) ??
      PICKABLE_LOCATIONS.find((l) => l.id === normalizedSelectedId) ??
      null
    )
  }, [locations, normalizedSelectedId])

  const orderingLocationId = location?.id ?? normalizedSelectedId ?? DEFAULT_LOCATION_ID

  return {
    location,
    locationId: orderingLocationId,
    selectedLocationId: normalizedSelectedId,
    locations,
    loading: loading || !hasHydrated,
    hasHydrated,
    hasSelection: Boolean(
      normalizedSelectedId &&
        (location ?? PICKABLE_LOCATIONS.some((l) => l.id === normalizedSelectedId)),
    ),
  }
}
