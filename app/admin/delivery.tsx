import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Linking, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAdminOrders } from '../../hooks/useAdminOrders'
import { useAllLocations } from '../../hooks/useLocations'
import { resolveOrderLocationLabel } from '../../lib/locationUtils'
import { useAdminLocationStore } from '../../store/adminLocationStore'
import { useAdminNavAlertStore } from '../../store/adminNavAlertStore'
import { AdminLocationFilter } from '../../components/admin/AdminLocationFilter'
import {
  isOrderActive,
  updateAdminOrderStatus,
  getCallableErrorMessage,
  isPaidOrder,
  resolveOrderCustomerInfo,
  type OrderCustomerProfile,
} from '../../lib/admin/orderAdmin'
import { formatCents } from '../../lib/admin/stats'
import { Order } from '../../types/order'
import { Address } from '../../types/user'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { Button } from '../../components/ui/Button'

function formatAddress(addr: Address): string {
  const street = addr.unit?.trim() ? `${addr.street}, ${addr.unit}` : addr.street
  return `${street}, ${addr.city}, ${addr.state} ${addr.zip}`
}

function DeliveryCard({
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
  const customer = resolveOrderCustomerInfo(order, customerProfiles)

  const markDelivered = async () => {
    setUpdating(true)
    try {
      await updateAdminOrderStatus(order.id, 'delivered')
    } catch (e) {
      Alert.alert('Update failed', getCallableErrorMessage(e))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.fee}>
          {formatCents(order.deliveryFee)}
          {order.deliveryDistanceMiles != null ? ` · ${order.deliveryDistanceMiles.toFixed(1)} mi` : ''}
        </Text>
      </View>

      {showLocation ? <Text style={styles.locationLine}>{locationLabel}</Text> : null}

      {customer.name ? <Text style={styles.customerName}>{customer.name}</Text> : null}
      {customer.phone ? (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${customer.phone}`)}>
          <Text style={styles.customerPhone}>{customer.phone}</Text>
        </TouchableOpacity>
      ) : null}

      {order.deliveryAddress ? (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={colors.goldLight} />
          <Text style={styles.address}>{formatAddress(order.deliveryAddress)}</Text>
        </View>
      ) : null}
      {order.deliveryAddress?.instructions ? (
        <Text style={styles.instructions}>Note: {order.deliveryAddress.instructions}</Text>
      ) : null}

      {order.items.map((item, idx) => (
        <Text key={`${item.menuItemId}-${idx}`} style={styles.itemLine}>
          {item.quantity}× {item.name}
        </Text>
      ))}

      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatCents(order.total)}</Text>
        <Button label="Mark Delivered" size="sm" onPress={markDelivered} loading={updating} />
      </View>
    </View>
  )
}

export default function AdminDeliveryScreen() {
  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const hasHydrated = useAdminLocationStore((s) => s.hasHydrated)
  const { locations } = useAllLocations()
  const markDeliveriesVisited = useAdminNavAlertStore((s) => s.markDeliveriesVisited)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    markDeliveriesVisited()
  }, [markDeliveriesVisited])

  const activeLocationId = filterLocationId ?? undefined
  const { orders, customerProfiles, loading: ordersLoading } = useAdminOrders(150, activeLocationId)
  const loading = ordersLoading || !hasHydrated
  const showAllLocations = filterLocationId === null

  const activeDeliveries = useMemo(
    () =>
      orders.filter((o) => o.fulfillmentType === 'delivery' && isPaidOrder(o) && isOrderActive(o)),
    [orders],
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Deliveries</Text>
        <Text style={styles.count}>{activeDeliveries.length} active</Text>
      </View>

      <AdminLocationFilter />

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {activeDeliveries.length === 0 ? (
            <Text style={styles.empty}>No active deliveries right now.</Text>
          ) : (
            activeDeliveries.map((order) => (
              <DeliveryCard
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
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 16,
  },
  fee: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 13,
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
    color: colors.gold,
    fontSize: 13,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 2,
  },
  address: {
    flex: 1,
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 13,
    lineHeight: 18,
  },
  instructions: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  itemLine: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  total: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
  },
})
