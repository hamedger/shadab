import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { MENU_CATEGORIES } from '../../constants/menu'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface MenuCategoryListProps {
  activeCategory: string | null
  onSelect: (id: string | null) => void
  counts: Record<string, number>
}

export function MenuCategoryList({
  activeCategory,
  onSelect,
  counts,
}: MenuCategoryListProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0)

  const items = [
    { id: null as string | null, label: 'All', count: totalCount },
    ...MENU_CATEGORIES.filter((c) => (counts[c.id] ?? 0) > 0).map((c) => ({
      id: c.id as string | null,
      label: c.label,
      count: counts[c.id] ?? 0,
    })),
  ]

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {items.map((item) => {
          const active = activeCategory === item.id
          return (
            <TouchableOpacity
              key={item.id ?? 'all'}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {item.label}
              </Text>
              <Text style={[styles.chipCount, active && styles.chipCountActive]}>
                {item.count}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  chipLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 14,
    letterSpacing: 0.15,
  },
  chipLabelActive: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
  },
  chipCount: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    opacity: 0.65,
  },
  chipCountActive: {
    color: colors.gold,
    opacity: 1,
  },
})
