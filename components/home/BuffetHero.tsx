import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useBuffet } from '../../hooks/useBuffet'
import { OrderOnlinePicker } from '../location/OrderOnlinePicker'
import { RESTAURANT_STATS } from '../../constants/home'
import {
  APP_TAGLINE,
  ONLINE_ORDERING_COMING_SOON_LABEL,
  ONLINE_ORDERING_ENABLED,
  OWNERSHIP_NOTE,
  RESTAURANT_FULL_NAME,
} from '../../constants/config'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { blurActiveElementOnWeb } from '../../lib/a11y'

const BG_IMAGE = require('../../assets/hero/hyderbadi_goat_dum_biryani.png')
const WIDE_BREAKPOINT = 720

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function BuffetHero() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isWide = width >= WIDE_BREAKPOINT
  const { isOpen, currentPrice, nextSessionLabel, countdownMinutes, isLoading } = useBuffet()

  const pulse = useSharedValue(1)

  useEffect(() => {
    if (isOpen) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        true,
      )
    } else {
      pulse.value = 1
    }
  }, [isOpen])

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))

  if (isLoading) return null

  const statusLabel = isOpen
    ? `Buffet open now — ${formatCents(currentPrice)}/person`
    : countdownMinutes
    ? `Buffet opens in ${Math.floor(countdownMinutes / 60)}h ${countdownMinutes % 60}m`
    : nextSessionLabel

  return (
    <View style={styles.section}>
      <Image source={BG_IMAGE} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(10,33,25,0.55)', 'rgba(10,33,25,0.88)', colors.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.inner, isWide && styles.innerWide]}>
        <Text style={styles.eyebrow}>{RESTAURANT_FULL_NAME}</Text>
        <Text style={styles.tagline}>{APP_TAGLINE} · Chicago, Illinois</Text>
        <Text style={styles.headline} accessibilityRole="header">
          Taste the{'\n'}Hyderabadi{'\n'}Heritage
        </Text>
        <Text style={styles.subtitle}>
          Authentic dum biryani, haleem, and royal feasts — breakfast, lunch, and dinner buffets
          every day, and open 24 hours on Devon Ave.
        </Text>

        <TouchableOpacity
          style={styles.statusPill}
          onPress={() => router.push('/(tabs)/buffet' as any)}
          activeOpacity={0.85}
        >
          <Animated.View style={[styles.dot, isOpen ? styles.dotOpen : styles.dotClosed, dotStyle]} />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </TouchableOpacity>

        <View style={styles.ctaRow}>
          {!ONLINE_ORDERING_ENABLED ? (
            <View style={[styles.cta, styles.ctaSoon]} accessibilityRole="text">
              <Text style={styles.ctaText}>{ONLINE_ORDERING_COMING_SOON_LABEL}</Text>
            </View>
          ) : (
            <OrderOnlinePicker>
              {(startOrder) => (
                <TouchableOpacity
                  style={styles.cta}
                  onPress={() => {
                    blurActiveElementOnWeb()
                    startOrder()
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Order online now"
                >
                  <Text style={styles.ctaText}>Order Online</Text>
                </TouchableOpacity>
              )}
            </OrderOnlinePicker>
          )}

          <TouchableOpacity
            style={styles.ctaOutline}
            onPress={() => {
              blurActiveElementOnWeb()
              router.push('/reservation' as never)
            }}
            accessibilityRole="button"
            accessibilityLabel="Reserve a table"
          >
            <Text style={styles.ctaOutlineText}>Reserve a Table</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctaOutline}
            onPress={() => router.push('/(tabs)/buffet' as any)}
            accessibilityRole="button"
            accessibilityLabel="See buffet menu"
          >
            <Text style={styles.ctaOutlineText}>See Buffet Menu</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ownership}>
          <Text style={styles.ownershipText}>{OWNERSHIP_NOTE}</Text>
        </View>

        <View style={[styles.stats, !isWide && styles.statsMobile]}>
          {RESTAURANT_STATS.map((stat, index) => (
            <React.Fragment key={stat.label}>
              {index > 0 && <View style={styles.statDivider} />}
              <View style={styles.stat}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    minHeight: 420,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  innerWide: {
    paddingVertical: spacing.xxl + spacing.lg,
  },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 12,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  tagline: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  ownership: {
    backgroundColor: '#9b1c1c',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.lg,
  },
  ownershipText: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headline: {
    fontFamily: fonts.display,
    color: colors.white,
    fontSize: 40,
    lineHeight: 44,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 420,
    marginBottom: spacing.lg,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(13,43,34,0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOpen: { backgroundColor: colors.greenLight },
  dotClosed: { backgroundColor: colors.goldDark },
  statusText: { fontFamily: fonts.sansMedium, color: colors.white, fontSize: 13 },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  cta: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  ctaSoon: { opacity: 0.75 },
  ctaText: {
    fontFamily: fonts.sansBold,
    color: colors.background,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  ctaOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  ctaOutlineText: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statsMobile: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', minWidth: 80 },
  statValue: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
})
