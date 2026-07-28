import { useCallback } from 'react'
import { Alert, Platform } from 'react-native'
import { useLocationStore } from '../store/locationStore'
import { useCartStore } from '../store/cartStore'

export function useLocationSelection() {
  const setSelectedLocationId = useLocationStore((s) => s.setSelectedLocationId)

  const applyLocation = useCallback(
    (locationId: string) => {
      setSelectedLocationId(locationId)
    },
    [setSelectedLocationId],
  )

  const selectLocation = useCallback(
    (locationId: string, onApplied?: () => void) => {
      const currentId = useLocationStore.getState().selectedLocationId
      if (currentId === locationId) {
        onApplied?.()
        return
      }

      const cartItems = useCartStore.getState().items
      if (cartItems.length === 0) {
        applyLocation(locationId)
        onApplied?.()
        return
      }

      const confirm = () => {
        useCartStore.getState().clearCart()
        applyLocation(locationId)
        onApplied?.()
      }

      const message =
        'Changing location will clear your cart. Items and pricing may differ by store.'

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm(message)) confirm()
        return
      }

      Alert.alert('Change location?', message, [
        { text: 'Keep cart', style: 'cancel' },
        { text: 'Change location', style: 'destructive', onPress: confirm },
      ])
    },
    [applyLocation],
  )

  return { selectLocation, applyLocation }
}
