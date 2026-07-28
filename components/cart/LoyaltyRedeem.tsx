import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useLoyalty } from '../../hooks/useLoyalty'
import { loyaltyDiscountCents } from '../../lib/services/loyaltyService'
import { LOYALTY } from '../../constants/config'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface LoyaltyRedeemProps {
  pointsToRedeem: number
  onChange: (points: number) => void
}

export function LoyaltyRedeem({ pointsToRedeem, onChange }: LoyaltyRedeemProps) {
  const { points, maxRedeemable } = useLoyalty()

  if (maxRedeemable < LOYALTY.pointsToDollar) return null

  const discount = loyaltyDiscountCents(pointsToRedeem)

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Loyalty Points</Text>
        <Text style={styles.balance}>{points.toLocaleString()} pts available</Text>
      </View>

      <View style={styles.actions}>
        {[100, 500].map((amount) => (
          <TouchableOpacity
            key={amount}
            style={[
              styles.chip,
              pointsToRedeem === amount && styles.chipActive,
              amount > maxRedeemable && styles.chipDisabled,
            ]}
            onPress={() => onChange(amount <= maxRedeemable ? amount : 0)}
            disabled={amount > maxRedeemable}
          >
            <Text
              style={[
                styles.chipText,
                pointsToRedeem === amount && styles.chipTextActive,
                amount > maxRedeemable && styles.chipTextDisabled,
              ]}
            >
              {amount} pts
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, pointsToRedeem === maxRedeemable && styles.chipActive]}
          onPress={() => onChange(maxRedeemable)}
        >
          <Text style={[styles.chipText, pointsToRedeem === maxRedeemable && styles.chipTextActive]}>
            Max
          </Text>
        </TouchableOpacity>
        {pointsToRedeem > 0 && (
          <TouchableOpacity style={styles.chip} onPress={() => onChange(0)}>
            <Text style={styles.chipText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {pointsToRedeem > 0 && (
        <Text style={styles.applied}>
          Applying {pointsToRedeem} pts (−${(discount / 100).toFixed(2)})
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 13,
  },
  balance: {
    fontFamily: fonts.sans,
    color: colors.gold,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.gold,
  },
  chipTextDisabled: {
    color: colors.whiteMuted,
  },
  applied: {
    fontFamily: fonts.sans,
    color: colors.greenLight,
    fontSize: 12,
  },
})
