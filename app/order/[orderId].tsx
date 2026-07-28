import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useOrder } from '../../hooks/useOrders'
import { useOrderStore } from '../../store/orderStore'
import { useLocations } from '../../hooks/useLocations'
import { OrderStatus } from '../../types/order'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { Button } from '../../components/ui/Button'
import { reorderToCart } from '../../lib/reorder'
import { canUserCancelOrder, cancelUserOrder } from '../../lib/services/orderService'
import { RESTAURANT_PHONE } from '../../constants/config'

type Step = { status: OrderStatus; label: string; icon: string }

const DELIVERY_STEPS: Step[] = [
  { status: 'placed', label: 'Order Placed', icon: 'receipt' },
  { status: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle' },
  { status: 'preparing', label: 'Preparing', icon: 'restaurant' },
  { status: 'ready', label: 'Ready', icon: 'bag-check' },
  { status: 'picked_up', label: 'Driver Picked Up', icon: 'bicycle' },
  { status: 'delivered', label: 'Delivered', icon: 'home' },
]

const PICKUP_STEPS: Step[] = [
  { status: 'placed', label: 'Order Placed', icon: 'receipt' },
  { status: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle' },
  { status: 'preparing', label: 'Preparing', icon: 'restaurant' },
  { status: 'ready', label: 'Ready for Pickup', icon: 'bag-check' },
  { status: 'picked_up', label: 'Picked Up', icon: 'checkmark-done' },
]

export default function OrderTrackingScreen() {
  const router = useRouter()
  const { orderId } = useLocalSearchParams<{ orderId: string }>()
  const { activeOrder: order } = useOrderStore()
  const { locations } = useLocations()
  const [cancelling, setCancelling] = useState(false)
  useOrder(orderId)

  const locationName = useMemo(
    () => (order ? locations.find((l) => l.id === order.locationId)?.name : undefined),
    [order, locations],
  )

  const handleCancel = () => {
    if (!order) return
    Alert.alert(
      'Cancel order?',
      'This cannot be undone. If you paid online, contact the restaurant for refund details.',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true)
            try {
              await cancelUserOrder(order.id)
            } catch (e) {
              Alert.alert(
                'Could not cancel',
                e instanceof Error ? e.message : 'Please try again or call the restaurant.',
              )
            } finally {
              setCancelling(false)
            }
          },
        },
      ],
    )
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.gold} />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    )
  }

  const isPickup = order.fulfillmentType !== 'delivery'
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS
  const statusOrder = steps.map((s) => s.status)
  const isComplete = isPickup ? order.status === 'picked_up' : order.status === 'delivered'
  const effectiveStatus =
    order.status === 'pending' ? 'placed' : order.status
  const currentIndex = statusOrder.indexOf(effectiveStatus as OrderStatus)
  const showCancel = canUserCancelOrder(order.status)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
        {isComplete && (
          <Text style={styles.deliveredBadge}>✓ {isPickup ? 'Picked Up' : 'Delivered'}</Text>
        )}
        {order.status === 'cancelled' && (
          <Text style={styles.cancelledBadge}>Order cancelled</Text>
        )}
        {locationName ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.goldLight} />
            <Text style={styles.locationText}>{locationName}</Text>
          </View>
        ) : null}
        <Text style={styles.fulfillment}>
          {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}
        </Text>
      </View>

      {/* Status Timeline */}
      {order.status !== 'cancelled' ? (
      <View style={styles.timeline}>
        {steps.map((step, idx) => {
          const done = currentIndex >= idx
          const active = currentIndex === idx
          return (
            <View key={step.status} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, done ? styles.dotDone : styles.dotPending, active && styles.dotActive]}>
                  <Ionicons name={step.icon as any} size={14} color={done ? colors.background : colors.whiteMuted} />
                </View>
                {idx < steps.length - 1 && <View style={[styles.line, done && styles.lineDone]} />}
              </View>
              <Text style={[styles.stepLabel, done ? styles.stepDone : styles.stepPending]}>
                {step.label}
              </Text>
            </View>
          )
        })}
      </View>
      ) : null}

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items Ordered</Text>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}×</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>${((item.price * item.quantity) / 100).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Delivery details */}
      {order.fulfillmentType === 'delivery' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          {order.deliveryFee > 0 ? (
            <Text style={styles.deliveryMeta}>
              Delivery fee: ${(order.deliveryFee / 100).toFixed(2)}
              {order.deliveryDistanceMiles != null
                ? ` · ${order.deliveryDistanceMiles.toFixed(1)} mi`
                : ''}
            </Text>
          ) : null}
          {order.scheduledFor && order.pickupTime ? (
            <Text style={styles.deliveryMeta}>
              Requested: {order.scheduledFor} {String(order.pickupTime)}
            </Text>
          ) : null}
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${RESTAURANT_PHONE}`)}>
            <Text style={styles.deliveryMeta}>Restaurant: {RESTAURANT_PHONE}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Totals */}
      <View style={styles.totals}>
        <TotalsRow label="Total" value={order.total} bold />
      </View>

      <Button
        label="Reorder"
        onPress={() => {
          reorderToCart(order)
          router.push('/(tabs)/cart' as never)
        }}
        fullWidth
        size="lg"
        style={{ marginTop: spacing.lg }}
      />

      {showCancel ? (
        <Button
          label="Cancel Order"
          onPress={handleCancel}
          variant="ghost"
          fullWidth
          size="lg"
          loading={cancelling}
          disabled={cancelling}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </ScrollView>
  )
}

function TotalsRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ color: bold ? colors.white : colors.whiteMuted, fontSize: 14, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ color: bold ? colors.gold : colors.white, fontSize: 14, fontWeight: bold ? '700' : '400' }}>${(value / 100).toFixed(2)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { color: colors.whiteMuted, fontFamily: fonts.sans },
  header: { marginBottom: spacing.xl },
  orderId: { color: colors.white, fontSize: 22, fontWeight: '800', fontFamily: fonts.serif },
  deliveredBadge: { color: colors.greenLight, fontSize: 14, fontWeight: '700', marginTop: 4 },
  cancelledBadge: { color: colors.error, fontSize: 14, fontWeight: '700', marginTop: 4 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  locationText: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
    fontSize: 13,
    flex: 1,
  },
  fulfillment: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    marginTop: 4,
  },
  timeline: { marginBottom: spacing.xl },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  timelineLeft: { alignItems: 'center', width: 32 },
  dot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  dotDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  dotPending: { backgroundColor: 'transparent', borderColor: colors.border },
  dotActive: { borderColor: colors.goldLight },
  line: { width: 2, flex: 1, minHeight: 20, backgroundColor: colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: colors.gold },
  stepLabel: { flex: 1, fontSize: 14, paddingTop: 6 },
  stepDone: { color: colors.white, fontWeight: '600' },
  stepPending: { color: colors.whiteMuted },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm },
  deliveryMeta: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemQty: { color: colors.gold, fontWeight: '700', marginRight: 8, width: 24 },
  itemName: { flex: 1, color: colors.white, fontSize: 14 },
  itemPrice: { color: colors.whiteMuted, fontSize: 14 },
  totals: { backgroundColor: colors.backgroundCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
})
