import { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { useLocations } from './useLocations'
import { useLocationSelection } from './useLocationSelection'
import { useLocationStore } from '../store/locationStore'

export function useOrderOnline() {
  const router = useRouter()
  const { locations, loading } = useLocations()
  const selectedLocationId = useLocationStore((s) => s.selectedLocationId)
  const { selectLocation } = useLocationSelection()
  const [pickerOpen, setPickerOpen] = useState(false)

  const goToMenu = useCallback(() => {
    router.push('/(tabs)/menu' as never)
  }, [router])

  const startOrder = useCallback(() => {
    if (loading) return

    const currentId = useLocationStore.getState().selectedLocationId
    const hasValidSelection = Boolean(
      currentId && locations.some((location) => location.id === currentId),
    )

    if (hasValidSelection) {
      goToMenu()
      return
    }

    if (locations.length <= 1) {
      if (locations[0]) selectLocation(locations[0].id, goToMenu)
      else goToMenu()
      return
    }

    setPickerOpen(true)
  }, [loading, locations, selectLocation, goToMenu])

  const closePicker = useCallback(() => setPickerOpen(false), [])

  const onLocationSelect = useCallback(
    (locationId: string) => {
      selectLocation(locationId, () => {
        setPickerOpen(false)
        goToMenu()
      })
    },
    [selectLocation, goToMenu],
  )

  return {
    startOrder,
    pickerOpen,
    closePicker,
    onLocationSelect,
    locations,
    loading,
    selectedLocationId,
  }
}
