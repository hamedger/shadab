import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useAllLocations } from '../../hooks/useLocations'
import { useAdminLocationStore } from '../../store/adminLocationStore'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface AdminLocationFilterProps {
  showAll?: boolean
}

export function AdminLocationFilter({ showAll = true }: AdminLocationFilterProps) {
  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const setFilterLocationId = useAdminLocationStore((s) => s.setFilterLocationId)
  const { locations, loading } = useAllLocations()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (loading || locations.length <= 1) return null

  const options = showAll
    ? [{ id: null as string | null, name: 'All locations' }, ...locations.map((l) => ({ id: l.id, name: l.name }))]
    : locations.map((l) => ({ id: l.id as string | null, name: l.name }))

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Location</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((opt) => {
          const active = filterLocationId === opt.id
          return (
            <TouchableOpacity
              key={opt.id ?? 'all'}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilterLocationId(opt.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.name}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: { gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.backgroundSecondary,
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  chipText: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 14,
    letterSpacing: 0.15,
  },
  chipTextActive: {
    color: colors.background,
  },
})
