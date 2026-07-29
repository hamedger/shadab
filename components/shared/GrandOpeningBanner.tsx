import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  GRAND_OPENING_BUFFET_PRICE_CENTS,
  hasGrandOpeningEnded,
  isGrandOpeningWindow,
} from '../../constants/buffet'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

const BG_IMAGE = require('../../assets/hero/Boneless_Chicken_Dum_Biryani.png')
const WIDE_BREAKPOINT = 720

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

const SPARKLES = [
  { top: '14%', left: '10%', size: 16, opacity: 0.8 },
  { top: '22%', left: '88%', size: 12, opacity: 0.6 },
  { top: '72%', left: '6%', size: 12, opacity: 0.5 },
  { top: '68%', left: '92%', size: 18, opacity: 0.75 },
  { top: '10%', left: '50%', size: 10, opacity: 0.5 },
] as const

export function GrandOpeningBanner() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isWide = width >= WIDE_BREAKPOINT

  if (hasGrandOpeningEnded()) return null

  const live = isGrandOpeningWindow()
  const price = formatCents(GRAND_OPENING_BUFFET_PRICE_CENTS)

  return (
    <View style={styles.section}>
      <Image source={BG_IMAGE} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(10,33,25,0.5)', 'rgba(10,33,25,0.86)', colors.background]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {SPARKLES.map((s, i) => (
        <Ionicons
          key={i}
          name="sparkles"
          size={s.size}
          color={colors.goldLight}
          style={[styles.sparkle, { top: s.top, left: s.left, opacity: s.opacity }]}
        />
      ))}

      <View style={[styles.inner, isWide && styles.innerWide]}>
        <View style={styles.ribbon}>
          <Text style={styles.ribbonText}>🎉 Grand Opening Celebration</Text>
        </View>

        <Text style={styles.headline} accessibilityRole="header">
          August 25 – 28
        </Text>

        <Text style={styles.priceLine}>
          Buffet <Text style={styles.priceValue}>{price}</Text>/person
        </Text>

        <Text style={styles.subtitle}>
          {live
            ? `Four days only — through Friday, August 28.`
            : `Mark your calendar — four days of celebration, starting August 25.`}
        </Text>

        <Text style={styles.urgency}>Reserve your table now to lock in the grand opening price.</Text>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/reservation' as never)}
          accessibilityRole="button"
          accessibilityLabel="Reserve a table for the grand opening buffet discount"
        >
          <Text style={styles.ctaText}>Reserve Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    minHeight: 360,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  sparkle: {
    position: 'absolute',
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  innerWide: {
    paddingVertical: spacing.xxl + spacing.md,
  },
  ribbon: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(13,43,34,0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  ribbonText: {
    fontFamily: fonts.sansBold,
    color: colors.goldLight,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  headline: {
    fontFamily: fonts.display,
    color: colors.white,
    fontSize: 44,
    lineHeight: 48,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  priceLine: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  priceValue: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 22,
  },
  subtitle: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 420,
    marginBottom: spacing.xs,
  },
  urgency: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cta: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl + 4,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  ctaText: {
    fontFamily: fonts.sansBold,
    color: colors.background,
    fontSize: 15,
    letterSpacing: 0.5,
  },
})
