import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface FilterOption<T extends string> {
  key: T
  label: string
}

interface SimpleFilterBarProps<T extends string> {
  options: FilterOption<T>[]
  counts: Partial<Record<T, number>>
  filter: T
  onChange: (filter: T) => void
}

export function SimpleFilterBar<T extends string>({
  options,
  counts,
  filter,
  onChange,
}: SimpleFilterBarProps<T>) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {options.map((opt) => {
          const active = filter === opt.key
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(opt.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{opt.label}</Text>
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
                  {counts[opt.key] ?? 0}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  chipLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 12,
  },
  chipLabelActive: {
    color: colors.background,
  },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: colors.background,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    color: colors.whiteMuted,
    fontSize: 11,
  },
  badgeTextActive: {
    color: colors.gold,
  },
})
