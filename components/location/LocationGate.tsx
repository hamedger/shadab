import React, { useEffect, useMemo, useState } from 'react'
import { DEFAULT_LOCATION_ID } from '../../constants/config'
import { STATIC_LOCATIONS } from '../../constants/staticLocations'
import { useLocationStore } from '../../store/locationStore'
import { useLocationSelection } from '../../hooks/useLocationSelection'
import { isLocationActive, normalizeLocationId } from '../../lib/locationUtils'
import { LocationPickerModal } from './LocationPickerModal'

const PICKABLE_LOCATIONS = STATIC_LOCATIONS.filter(isLocationActive)

interface LocationGateProps {
  children: React.ReactNode
}

export function LocationGate({ children }: LocationGateProps) {
  const hydrate = useLocationStore((s) => s.hydrate)
  const hasHydrated = useLocationStore((s) => s.hasHydrated)
  const selectedLocationId = useLocationStore((s) => s.selectedLocationId)
  const { selectLocation, applyLocation } = useLocationSelection()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const validSelection = useMemo(() => {
    if (!selectedLocationId) return false
    const normalizedId = normalizeLocationId(selectedLocationId)
    return PICKABLE_LOCATIONS.some((l) => l.id === normalizedId)
  }, [selectedLocationId])

  useEffect(() => {
    if (!hasHydrated || validSelection) return

    const defaultLocation =
      PICKABLE_LOCATIONS.find((l) => l.id === DEFAULT_LOCATION_ID) ?? PICKABLE_LOCATIONS[0]
    if (defaultLocation) applyLocation(defaultLocation.id)
  }, [hasHydrated, validSelection, applyLocation])

  const mustPick =
    hasHydrated && PICKABLE_LOCATIONS.length > 1 && !validSelection && !dismissed

  return (
    <>
      {children}
      <LocationPickerModal
        visible={mustPick}
        locations={PICKABLE_LOCATIONS}
        selectedLocationId={selectedLocationId}
        title="Select your location"
        required
        onSelect={(id) => {
          selectLocation(id, () => setDismissed(true))
        }}
        onClose={() => {}}
      />
    </>
  )
}
