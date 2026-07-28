import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Order, OrderStatus } from '../../types/order'
import { ORDER_STATUS_LABELS, isOrderActive, isPaidOrder } from '../../lib/admin/orderAdmin'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

export type OrderFilter = OrderStatus | 'active' | 'all'

const STATUS_FILTERS: OrderStatus[] = [
  'pending',
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
  'cancelled',
]

interface OrderFilterBarProps {
  orders: Order[]
  filter: OrderFilter
  onChange: (filter: OrderFilter) => void
}

function countForFilter(orders: Order[], filter: OrderFilter): number {
  if (filter === 'all') return orders.filter(isPaidOrder).length
  if (filter === 'active') {
    return orders.filter((o) => isPaidOrder(o) && isOrderActive(o)).length
  }
  return orders.filter((o) => o.status === filter).length
}

export function OrderFilterBar({ orders, filter, onChange }: OrderFilterBarProps) {
  const counts = useMemo(() => {
    const map = new Map<OrderFilter, number>()
    map.set('active', countForFilter(orders, 'active'))
    map.set('all', countForFilter(orders, 'all'))
    for (const s of STATUS_FILTERS) {
      map.set(s, countForFilter(orders, s))
    }
    return map
  }, [orders])

  return (
    <View style={styles.wrap}>
      <View style={styles.primaryRow}>
        {(['active', 'all'] as const).map((key) => (
          <FilterChip
            key={key}
            label={key === 'active' ? 'Active' : 'All orders'}
            count={counts.get(key) ?? 0}
            active={filter === key}
            onPress={() => onChange(key)}
            large
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Filter by status</Text>
      <View style={styles.statusGrid}>
        {STATUS_FILTERS.map((status) => (
          <FilterChip
            key={status}
            label={ORDER_STATUS_LABELS[status]}
            count={counts.get(status) ?? 0}
            active={filter === status}
            onPress={() => onChange(status)}
          />
        ))}
      </View>
    </View>
  )
}

function FilterChip({
  label,
  count,
  active,
  onPress,
  large,
}: {
  label: string
  count: number
  active: boolean
  onPress: () => void
  large?: boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, large && styles.chipLarge, active && styles.chipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipLabel, large && styles.chipLabelLarge, active && styles.chipLabelActive]}>
        {label}
      </Text>
      <View style={[styles.badge, active && styles.badgeActive]}>
        <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
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
    borderColor: colors.borderStrong,
    gap: spacing.md,
  },
  primaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.backgroundSecondary,
  },
  chipLarge: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  chipLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 14,
    letterSpacing: 0.15,
  },
  chipLabelLarge: {
    fontSize: 15,
  },
  chipLabelActive: {
    color: colors.background,
  },
  badge: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: colors.background,
    borderColor: colors.background,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    color: colors.goldLight,
    fontSize: 12,
  },
  badgeTextActive: {
    color: colors.gold,
  },
})
