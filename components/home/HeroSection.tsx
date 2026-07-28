import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, LayoutChangeEvent } from 'react-native'
import { useRouter } from 'expo-router'
import { HeroSplash } from './HeroSplash'
import { OrderOnlinePicker } from '../location/OrderOnlinePicker'
import { LocationSelector } from '../location/LocationSelector'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { APP_TAGLINE } from '../../constants/config'
import { blurActiveElementOnWeb } from '../../lib/a11y'

const WIDE_BREAKPOINT = 720

export function HeroSection() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isWide = width >= WIDE_BREAKPOINT
  const [splashWidth, setSplashWidth] = useState(isWide ? 560 : width)

  const onSplashLayout = (e: LayoutChangeEvent) => {
    const measured = Math.round(e.nativeEvent.layout.width)
    if (measured > 0) setSplashWidth(measured)
  }

  useEffect(() => {
    if (!isWide) setSplashWidth(width)
  }, [isWide, width])

  return (
    <View style={styles.wrapper}>
      <View style={[styles.heroRow, !isWide && styles.heroRowStacked]}>
        <View style={styles.content}>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
          <Text style={styles.title} accessibilityRole="header">
            Taste the{'\n'}Hyderabadi{'\n'}Heritage
          </Text>
          <Text style={styles.subtitle}>
            Authentic dum biryani, haleem, and royal feasts — crafted the traditional way in
            Chicago.
          </Text>
          <LocationSelector />
          <View style={styles.ctaRow}>
            <OrderOnlinePicker>
              {(startOrder) => (
                <TouchableOpacity
                  style={styles.primaryCta}
                  onPress={() => {
                    blurActiveElementOnWeb()
                    startOrder()
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Order online now"
                >
                  <Text style={styles.primaryCtaText}>Order Online</Text>
                </TouchableOpacity>
              )}
            </OrderOnlinePicker>
            <TouchableOpacity
              style={styles.secondaryCta}
              onPress={() => {
                blurActiveElementOnWeb()
                router.push('/reservation' as never)
              }}
              accessibilityRole="button"
              accessibilityLabel="Reserve a table"
            >
              <Text style={styles.secondaryCtaText}>Reserve a Table</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[styles.splashWrap, !isWide && styles.splashWrapBleed]}
          onLayout={onSplashLayout}
        >
          {splashWidth > 0 && <HeroSplash width={splashWidth} />}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  heroRowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  content: {
    flex: 1,
    minWidth: 0,
    maxWidth: 420,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  splashWrap: {
    flex: 1.4,
    flexShrink: 0,
    minWidth: 480,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  splashWrapBleed: {
    marginHorizontal: -spacing.lg,
    alignSelf: 'stretch',
  },
  tagline: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.white,
    fontSize: 44,
    lineHeight: 48,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.lg,
    maxWidth: 420,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  primaryCta: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.sm,
  },
  primaryCtaText: {
    fontFamily: fonts.sansBold,
    color: colors.background,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  secondaryCta: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.sm,
  },
  secondaryCtaText: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
})
