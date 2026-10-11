import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { FulfillmentSelector } from '../../components/cart/FulfillmentSelector'
import { LoyaltyRedeem } from '../../components/cart/LoyaltyRedeem'
import { TipSelector } from '../../components/cart/TipSelector'
import { loyaltyDiscountCents } from '../../lib/services/loyaltyService'
import { TAXES_AND_FEES_LABEL } from '../../lib/services/cartService'
import { CONTENT_MAX_WIDTH } from '../../constants/checkout'
import { DELIVERY_ENABLED, ONLINE_ORDERING_COMING_SOON_LABEL, ONLINE_ORDERING_ENABLED } from '../../constants/config'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { Button } from '../../components/ui/Button'
import { OrderItem } from '../../types/order'
import { useSelectedLocation } from '../../hooks/useSelectedLocation'
import { LocationConfirmCard } from '../../components/location/LocationConfirmCard'
import { PickupScheduler } from '../../components/checkout/PickupScheduler'
import { formatLocationAddress, getOrderFulfillmentHours, getPickupPrepBufferMinutes } from '../../lib/locationUtils'

function CartRow({
  item,
  onInc,
  onDec,
  onRemove,
}: {
  item: OrderItem
  onInc: () => void
  onDec: () => void
  onRemove: () => void
}) {
  return (
    <View style={styles.cartCard}>
      {item.imageURL ? (
        <Image source={{ uri: item.imageURL }} style={styles.rowImage} contentFit="cover" />
      ) : (
        <View style={[styles.rowImage, styles.rowImagePlaceholder]}>
          <Ionicons name="restaurant-outline" size={22} color={colors.whiteMuted} />
        </View>
      )}
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.rowUnit}>
          ${(item.price / 100).toFixed(2)} each
        </Text>
        <View style={styles.rowFooter}>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={onDec}>
              <Ionicons name="remove" size={14} color={colors.gold} />
            </TouchableOpacity>
            <Text style={styles.qty}>{item.quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={onInc}>
              <Ionicons name="add" size={14} color={colors.gold} />
            </TouchableOpacity>
          </View>
          <Text style={styles.rowPrice}>
            ${((item.price * item.quantity) / 100).toFixed(2)}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.whiteMuted} />
      </TouchableOpacity>
    </View>
  )
}

function SummaryRow({
  label,
  value,
  bold,
  gold,
  muted,
}: {
  label: string
  value: number
  bold?: boolean
  gold?: boolean
  muted?: boolean
}) {
  const displayValue =
    value < 0
      ? `-$${(Math.abs(value) / 100).toFixed(2)}`
      : value === 0 && muted
        ? 'Free'
        : `$${(value / 100).toFixed(2)}`

  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.bold]}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          bold && styles.bold,
          gold && { color: colors.gold },
          muted && value === 0 && { color: colors.success },
        ]}
      >
        {displayValue}
      </Text>
    </View>
  )
}

export default function CartScreen() {
  const router = useRouter()
  const cart = useCart()
  const { firebaseUser, userProfile } = useAuth()
  const [promoInput, setPromoInput] = useState('')
  const itemCount = cart.itemCount()
  const showLoyalty = !!firebaseUser && !userProfile?.isGuest
  const loyaltyDiscount = loyaltyDiscountCents(cart.loyaltyPointsToRedeem)
  const { location, locationId, locations, loading: locationsLoading } = useSelectedLocation()
  const isDelivery = DELIVERY_ENABLED && cart.fulfillmentType === 'delivery'
  const prepBufferMinutes = getPickupPrepBufferMinutes(location)
  const fulfillmentHours = getOrderFulfillmentHours(location)

  if (cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyInner}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add some delicious dishes to get started</Text>
          <Button
            label="Browse Menu"
            onPress={() => router.push('/(tabs)/menu' as never)}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.heading}>Your Cart</Text>
            <Text style={styles.subheading}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {location ? (
            <LocationConfirmCard
              location={location}
              locations={locations}
              selectedLocationId={locationId}
              loading={locationsLoading}
            />
          ) : null}

          <View style={styles.itemsSection}>
            {cart.items.map((item) => (
              <CartRow
                key={item.menuItemId}
                item={item}
                onInc={() => cart.updateQuantity(item.menuItemId, item.quantity + 1)}
                onDec={() => cart.updateQuantity(item.menuItemId, item.quantity - 1)}
                onRemove={() => cart.removeItem(item.menuItemId)}
              />
            ))}
          </View>

          <FulfillmentSelector
            value={cart.fulfillmentType}
            onChange={cart.setFulfillmentType}
            pickupAddress={location ? formatLocationAddress(location.address) : undefined}
          />

          <PickupScheduler
            date={cart.pickupDate}
            time={cart.pickupTime}
            pickupAddress={location ? formatLocationAddress(location.address) : ''}
            locationName={location?.name}
            prepBufferMinutes={prepBufferMinutes}
            fulfillmentHours={fulfillmentHours}
            fulfillmentType={cart.fulfillmentType}
            onDateChange={cart.setPickupDate}
            onTimeChange={cart.setPickupTime}
          />

          {isDelivery ? (
            <Text style={styles.deliveryHint}>
              Delivery fee and ETA are quoted at checkout after you enter your address.
            </Text>
          ) : null}

          <View style={styles.summaryCard}>
            <View style={styles.promoRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Promo code"
                placeholderTextColor={colors.whiteMuted}
                value={promoInput}
                onChangeText={setPromoInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.promoBtn}>
                <Text style={styles.promoBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {showLoyalty && (
              <LoyaltyRedeem
                pointsToRedeem={cart.loyaltyPointsToRedeem}
                onChange={cart.setLoyaltyPoints}
              />
            )}

            <TipSelector
              subtotal={cart.subtotal()}
              tipPercent={cart.tipPercent}
              tip={cart.tip}
              fulfillmentType={cart.fulfillmentType}
              onSelectPercent={cart.setTipPercent}
              onSelectCustom={cart.setTip}
            />

            <SummaryRow label="Subtotal" value={cart.subtotal()} />
            <SummaryRow label={TAXES_AND_FEES_LABEL} value={cart.tax + cart.serviceFee} />
            {DELIVERY_ENABLED && cart.fulfillmentType === 'delivery' &&
              (cart.deliveryQuoteReady ? (
                <SummaryRow label="Delivery Fee" value={cart.deliveryFee} muted />
              ) : (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={[styles.summaryValue, { color: colors.whiteMuted }]}>
                    Quoted at checkout
                  </Text>
                </View>
              ))}
            {cart.promoDiscount > 0 && (
              <SummaryRow label="Promo Discount" value={-cart.promoDiscount} gold />
            )}
            {loyaltyDiscount > 0 && (
              <SummaryRow label="Loyalty Discount" value={-loyaltyDiscount} gold />
            )}
            {cart.tip > 0 && <SummaryRow label="Tip" value={cart.tip} gold />}
            <View style={styles.divider} />
            <SummaryRow label="Total" value={cart.total} bold />
          </View>
        </View>
      </ScrollView>

      <View style={styles.checkoutBar}>
        <View style={styles.checkoutInner}>
          <View>
            <Text style={styles.checkoutLabel}>Estimated total</Text>
            <Text style={styles.checkoutTotal}>${(cart.total / 100).toFixed(2)}</Text>
          </View>
          <Button
            label={ONLINE_ORDERING_ENABLED ? 'Checkout' : ONLINE_ORDERING_COMING_SOON_LABEL}
            onPress={() => router.push('/checkout' as never)}
            disabled={!ONLINE_ORDERING_ENABLED}
            size="lg"
            style={styles.checkoutBtn}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    gap: spacing.md,
  },
  header: { gap: 4 },
  heading: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 26,
  },
  subheading: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
  },
  itemsSection: { gap: spacing.sm },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  rowImage: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
  },
  rowImagePlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
    lineHeight: 20,
  },
  rowUnit: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    marginTop: 2,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 14,
    minWidth: 20,
    textAlign: 'center',
  },
  rowPrice: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 16,
  },
  removeBtn: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  promoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  promoInput: {
    flex: 1,
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 14,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  promoBtn: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  promoBtnText: {
    fontFamily: fonts.sansBold,
    color: colors.background,
    fontSize: 13,
  },
  deliveryHint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: -spacing.xs,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
  },
  summaryValue: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 14,
  },
  bold: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  checkoutBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  checkoutInner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  checkoutLabel: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
  },
  checkoutTotal: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 22,
  },
  checkoutBtn: {
    minWidth: 140,
    paddingHorizontal: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyInner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 22,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    textAlign: 'center',
  },
})
