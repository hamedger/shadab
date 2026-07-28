import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAdminOrders } from '../../hooks/useAdminOrders'
import { useAllLocations } from '../../hooks/useLocations'
import { resolveOrderLocationLabel } from '../../lib/locationUtils'
import { useAdminLocationStore } from '../../store/adminLocationStore'
import { useAdminNavAlertStore } from '../../store/adminNavAlertStore'
import { AdminLocationFilter } from '../../components/admin/AdminLocationFilter'
import {
  isOrderActive,
  nextOrderStatus,
  ORDER_STATUS_LABELS,
  updateAdminOrderStatus,
  getCallableErrorMessage,
  isPaidOrder,
  resolveOrderCustomerInfo,
  type OrderCustomerProfile,
} from '../../lib/admin/orderAdmin'
import { formatCents, formatOrderTime } from '../../lib/admin/stats'
import { Order, OrderStatus } from '../../types/order'
import { OrderFilterBar, OrderFilter } from '../../components/admin/OrderFilterBar'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { Button } from '../../components/ui/Button'

function statusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return colors.goldLight
    case 'placed':
    case 'confirmed':
    case 'preparing':
      return colors.gold
    case 'ready':
      return colors.greenLight
    case 'picked_up':
      return colors.green
    case 'delivered':
      return colors.whiteMuted
    case 'cancelled':
      return colors.error
    default:
      return colors.white
  }
}

function OrderCard({
  order,
  locationLabel,
  showLocation,
  customerProfiles,
}: {
  order: Order
  locationLabel: string
  showLocation: boolean
  customerProfiles: Map<string, OrderCustomerProfile>
}) {
  const [updating, setUpdating] = useState(false)
  const next = nextOrderStatus(order.status, order.fulfillmentType)
  const customer = resolveOrderCustomerInfo(order, customerProfiles)

  const advance = async () => {
    if (!next) return
    setUpdating(true)
    try {
      await updateAdminOrderStatus(order.id, next)
    } catch (e) {
      Alert.alert('Update failed', getCallableErrorMessage(e))
    } finally {
      setUpdating(false)
    }
  }

  const cancel = async () => {
    setUpdating(true)
    try {
      await updateAdminOrderStatus(order.id, 'cancelled')
    } catch (e) {
      Alert.alert('Update failed', getCallableErrorMessage(e))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderTime}>{formatOrderTime(order.createdAt)}</Text>
        </View>
        <View style={styles.headerBadges}>
          <View
            style={[
              styles.fulfillmentBadge,
              order.fulfillmentType === 'delivery'
                ? styles.fulfillmentBadgeDelivery
                : styles.fulfillmentBadgePickup,
            ]}
          >
            <Ionicons
              name={order.fulfillmentType === 'delivery' ? 'bicycle' : 'bag-handle'}
              size={13}
              color={order.fulfillmentType === 'delivery' ? colors.gold : colors.background}
            />
            <Text
              style={[
                styles.fulfillmentBadgeText,
                order.fulfillmentType === 'delivery' && styles.fulfillmentBadgeTextDelivery,
              ]}
            >
              {order.fulfillmentType === 'delivery' ? 'DELIVERY' : 'PICKUP'}
            </Text>
          </View>
          <View style={[styles.statusPill, { borderColor: statusColor(order.status) }]}>
            <Text style={[styles.statusText, { color: statusColor(order.status) }]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Text>
          </View>
        </View>
      </View>

      {showLocation ? <Text style={styles.locationLine}>{locationLabel}</Text> : null}

      {customer.name ? <Text style={styles.customerName}>{customer.name}</Text> : null}
      {customer.phone ? <Text style={styles.customerPhone}>{customer.phone}</Text> : null}

      {order.items.map((item, idx) => (
        <Text key={`${item.menuItemId}-${idx}`} style={styles.itemLine}>
          {item.quantity}× {item.name}
        </Text>
      ))}

      {order.fulfillmentType === 'delivery' ? (
        <View style={styles.deliveryMetaBlock}>
          <Text style={styles.deliveryMeta}>Delivery fee: {formatCents(order.deliveryFee)}</Text>
          {order.deliveryDistanceMiles != null ? (
            <Text style={styles.deliveryMeta}>
              Distance: {order.deliveryDistanceMiles.toFixed(1)} mi
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatCents(order.total)}</Text>
        <View style={styles.actions}>
          {isOrderActive(order) && (
            <>
              {next ? (
                <Button
                  label={`Mark ${ORDER_STATUS_LABELS[next]}`}
                  size="sm"
                  onPress={advance}
                  loading={updating}
                />
              ) : null}
              <Button
                label="Cancel"
                size="sm"
                variant="ghost"
                onPress={cancel}
                disabled={updating}
              />
            </>
          )}
        </View>
      </View>
    </View>
  )
}

export default function AdminOrdersScreen() {
  const { location: locationParam } = useLocalSearchParams<{ location?: string }>()
  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const setFilterLocationId = useAdminLocationStore((s) => s.setFilterLocationId)
  const hasHydrated = useAdminLocationStore((s) => s.hasHydrated)
  const { locations } = useAllLocations()
  const markOrdersVisited = useAdminNavAlertStore((s) => s.markOrdersVisited)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    markOrdersVisited()
  }, [markOrdersVisited])

  useEffect(() => {
    if (typeof locationParam === 'string' && locationParam.trim()) {
      setFilterLocationId(locationParam.trim())
    }
  }, [locationParam, setFilterLocationId])

  const activeLocationId = filterLocationId ?? undefined
  const { orders, customerProfiles, loading: ordersLoading } = useAdminOrders(150, activeLocationId)
  const loading = ordersLoading || !hasHydrated
  const [filter, setFilter] = useState<OrderFilter>('active')

  const showAllLocations = filterLocationId === null

  const filtered = useMemo(() => {
    if (filter === 'all') return orders.filter(isPaidOrder)
    if (filter === 'active') {
      return orders.filter((o) => isPaidOrder(o) && isOrderActive(o))
    }
    return orders.filter((o) => o.status === filter)
  }, [orders, filter])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Orders</Text>
        <Text style={styles.count}>{filtered.length} shown</Text>
      </View>

      <AdminLocationFilter />
      <OrderFilterBar orders={orders} filter={filter} onChange={setFilter} />

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No orders match this filter.</Text>
          ) : (
            filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                showLocation={showAllLocations}
                locationLabel={resolveOrderLocationLabel(order.locationId, locations)}
                customerProfiles={customerProfiles}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  heading: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 28,
  },
  count: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  empty: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  orderId: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 16,
  },
  orderTime: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    marginTop: 2,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fulfillmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  fulfillmentBadgeDelivery: {
    backgroundColor: 'rgba(212,175,55,0.14)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  fulfillmentBadgePickup: {
    backgroundColor: colors.goldLight,
  },
  fulfillmentBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.background,
  },
  fulfillmentBadgeTextDelivery: {
    color: colors.gold,
  },
  locationLine: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
    fontSize: 12,
  },
  customerName: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 14,
  },
  customerPhone: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  itemLine: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  deliveryMetaBlock: {
    marginTop: spacing.xs,
    gap: 2,
  },
  deliveryMeta: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  total: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
})
