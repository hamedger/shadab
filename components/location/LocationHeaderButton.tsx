import React, { useState } from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSelectedLocation } from '../../hooks/useSelectedLocation'
import { useLocationSelection } from '../../hooks/useLocationSelection'
import { formatLocationShort } from '../../lib/locationUtils'
import { LocationPickerModal } from './LocationPickerModal'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

export function LocationHeaderButton() {
  const { location, locations, loading, selectedLocationId } = useSelectedLocation()
  const { selectLocation } = useLocationSelection()
  const [open, setOpen] = useState(false)

  const label = location ? formatLocationShort(location) : 'Select location'

  return (
    <>
      <TouchableOpacity style={styles.btn} onPress={() => setOpen(true)} hitSlop={8}>
        <Ionicons name="location-outline" size={14} color={colors.gold} />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={12} color={colors.whiteMuted} />
      </TouchableOpacity>

      <LocationPickerModal
        visible={open}
        locations={locations}
        selectedLocationId={selectedLocationId}
        loading={loading}
        onSelect={(id) => {
          selectLocation(id, () => setOpen(false))
        }}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 140,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(212,175,55,0.06)',
    marginRight: spacing.sm,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
    fontSize: 11,
  },
})
