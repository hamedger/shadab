import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { STATIC_LOCATIONS } from '../../constants/staticLocations'
import { DEFAULT_LOCATION_ID } from '../../constants/config'
import { useSelectedLocation } from '../../hooks/useSelectedLocation'
import { useLocationSelection } from '../../hooks/useLocationSelection'
import { formatLocationShort, isLocationActive } from '../../lib/locationUtils'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface LocationSelectorProps {
  label?: string
}

const HERO_LOCATIONS = STATIC_LOCATIONS.filter(isLocationActive)

export function LocationSelector({ label = 'Order from' }: LocationSelectorProps) {
  const { selectedLocationId, hasHydrated } = useSelectedLocation()
  const { selectLocation, applyLocation } = useLocationSelection()

  useEffect(() => {
    if (!hasHydrated || selectedLocationId) return
    const defaultLocation =
      HERO_LOCATIONS.find((loc) => loc.id === DEFAULT_LOCATION_ID) ?? HERO_LOCATIONS[0]
    if (defaultLocation) applyLocation(defaultLocation.id)
  }, [hasHydrated, selectedLocationId, applyLocation])

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {HERO_LOCATIONS.map((loc) => {
          const selected = loc.id === selectedLocationId
          return (
            <TouchableOpacity
              key={loc.id}
              style={[styles.option, selected ? styles.optionSelected : styles.optionIdle]}
              onPress={() => selectLocation(loc.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Order from ${formatLocationShort(loc)}`}
            >
              <Ionicons
                name={selected ? 'checkmark-circle' : 'storefront-outline'}
                size={16}
                color={selected ? colors.background : colors.whiteMuted}
              />
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {formatLocationShort(loc)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
  },
  optionIdle: {
    borderColor: colors.border,
    backgroundColor: 'rgba(212,175,55,0.04)',
    opacity: 0.72,
  },
  optionSelected: {
    borderColor: colors.goldBright,
    backgroundColor: colors.gold,
    opacity: 1,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  optionText: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 14,
  },
  optionTextSelected: {
    fontFamily: fonts.sansBold,
    color: colors.background,
  },
})
