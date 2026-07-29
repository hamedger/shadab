import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import {
  GRAND_OPENING_BUFFET_PRICE_CENTS,
  hasGrandOpeningEnded,
  isGrandOpeningWindow,
} from '../../constants/buffet'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function GrandOpeningBanner() {
  const router = useRouter()

  if (hasGrandOpeningEnded()) return null

  const live = isGrandOpeningWindow()
  const price = formatCents(GRAND_OPENING_BUFFET_PRICE_CENTS)

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>🎉 Grand Opening — August 25</Text>
      <Text style={styles.text}>
        {live
          ? `Buffet is ${price}/person through Friday, August 28.`
          : `Buffet will be ${price}/person, August 25–28. Mark your calendar!`}
      </Text>
      <Text style={styles.urgency}>
        Reserve your table now for Aug 25–28 to lock in the {price} buffet.
      </Text>
      <TouchableOpacity
        style={styles.cta}
        onPress={() => router.push('/reservation' as never)}
        accessibilityRole="button"
        accessibilityLabel="Reserve a table for the grand opening buffet discount"
      >
        <Text style={styles.ctaText}>Reserve Now</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(201,162,75,0.08)',
    alignItems: 'center',
    gap: 2,
  },
  title: { fontFamily: fonts.sansBold, color: colors.gold, fontSize: 14 },
  text: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12, textAlign: 'center' },
  urgency: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  ctaText: {
    fontFamily: fonts.sansBold,
    color: colors.background,
    fontSize: 13,
    letterSpacing: 0.4,
  },
})
