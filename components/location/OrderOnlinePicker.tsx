import React from 'react'
import { LocationPickerModal } from './LocationPickerModal'
import { useOrderOnline } from '../../hooks/useOrderOnline'

interface OrderOnlinePickerProps {
  children: (startOrder: () => void) => React.ReactNode
}

export function OrderOnlinePicker({ children }: OrderOnlinePickerProps) {
  const {
    startOrder,
    pickerOpen,
    closePicker,
    onLocationSelect,
    locations,
    loading,
    selectedLocationId,
  } = useOrderOnline()

  return (
    <>
      {children(startOrder)}
      <LocationPickerModal
        visible={pickerOpen}
        locations={locations}
        selectedLocationId={selectedLocationId}
        loading={loading}
        title="Select your location"
        onSelect={onLocationSelect}
        onClose={closePicker}
      />
    </>
  )
}
