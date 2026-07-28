import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { FulfillmentType } from '../../types/order'
import {
  DELIVERY_ENABLED,
  DELIVERY_FULFILLMENT_HOURS,
  DELIVERY_MINIMUM_SUBTOTAL_CENTS,
  RESTAURANT_ADDRESS,
} from '../../constants/config'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

function formatHour12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour12}${period}` : `${hour12}:${String(m).padStart(2, '0')}${period}`
}

interface FulfillmentSelectorProps {
  value: FulfillmentType
  onChange: (type: FulfillmentType) => void
  pickupAddress?: string
}

export function FulfillmentSelector({
  value,
  onChange,
  pickupAddress,
}: FulfillmentSelectorProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>How would you like your order?</Text>

      <TouchableOpacity
        style={[
          styles.card,
          value === 'delivery' && styles.cardActive,
          !DELIVERY_ENABLED && styles.cardDisabled,
        ]}
        onPress={() => DELIVERY_ENABLED && onChange('delivery')}
        activeOpacity={DELIVERY_ENABLED ? 0.8 : 1}
        disabled={!DELIVERY_ENABLED}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, styles.deliveryIcon]}>
            <Ionicons name="bicycle" size={20} color={colors.gold} />
          </View>
          <View style={styles.cardTitles}>
            <Text style={[styles.cardTitle, !DELIVERY_ENABLED && styles.cardTitleMuted]}>
              Delivery
            </Text>
            {DELIVERY_ENABLED ? (
              <Text style={styles.cardBadge}>Free within 1 mile · $1/mile after</Text>
            ) : (
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            )}
          </View>
          {DELIVERY_ENABLED && value === 'delivery' ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.gold} />
          ) : (
            <View style={styles.radio} />
          )}
        </View>
        {DELIVERY_ENABLED ? (
          <Text style={styles.cardHint}>
            ${(DELIVERY_MINIMUM_SUBTOTAL_CENTS / 100).toFixed(0)} minimum order ·{' '}
            {formatHour12(DELIVERY_FULFILLMENT_HOURS.open)}–{formatHour12(DELIVERY_FULFILLMENT_HOURS.close)}{' '}
            daily
          </Text>
        ) : (
          <Text style={styles.cardHint}>
            Delivery is coming in a future update. Pickup is available now.
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, value === 'pickup' && styles.cardActive]}
        onPress={() => onChange('pickup')}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, styles.pickupIcon]}>
            <Ionicons name="bag-handle" size={20} color={colors.gold} />
          </View>
          <View style={styles.cardTitles}>
            <Text style={styles.cardTitle}>Restaurant Pickup</Text>
            <Text style={styles.cardBadge}>No delivery fees</Text>
          </View>
          {value === 'pickup' ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.gold} />
          ) : (
            <View style={styles.radio} />
          )}
        </View>
        <Text style={styles.cardHint} numberOfLines={2}>
          {pickupAddress ?? RESTAURANT_ADDRESS}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  cardActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  cardDisabled: {
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryIcon: { backgroundColor: 'rgba(212,175,55,0.12)' },
  pickupIcon: { backgroundColor: 'rgba(212,175,55,0.12)' },
  cardTitles: { flex: 1 },
  cardTitle: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
  },
  cardTitleMuted: {
    color: colors.whiteMuted,
  },
  cardBadge: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    marginTop: 2,
  },
  comingSoonBadge: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  cardHint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    lineHeight: 17,
    marginLeft: 48,
  },
})
