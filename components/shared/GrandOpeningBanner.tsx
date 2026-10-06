import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  BUFFET_HIGHLIGHTS,
  GRAND_OPENING_START,
  hasGrandOpeningEnded,
  isGrandOpeningWindow,
  MUTTON_SPECIALTIES,
} from '../../constants/buffet'
import { getMealStatusesForDate } from '../../lib/services/buffetService'
import { BuffetPriceCards } from '../buffet/BuffetPriceCards'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

const HEADER_IMAGE = require('../../assets/flyers/grand-opening-header.jpg')
const HEADER_ASPECT = 1024 / 640
const MAX_WIDTH = 960

function formatOpeningDate(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Grand opening week promo (Oct 16–22): flyer header, special buffet prices, highlights, reserve CTA. */
export function GrandOpeningBanner() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const meals = useMemo(() => getMealStatusesForDate(GRAND_OPENING_START), [])

  if (hasGrandOpeningEnded()) return null

  const live = isGrandOpeningWindow()
  const imageWidth = Math.min(width, MAX_WIDTH)

  return (
    <View style={styles.section}>
      <Image
        source={HEADER_IMAGE}
        style={{ width: imageWidth, height: imageWidth / HEADER_ASPECT, alignSelf: 'center' }}
        contentFit="cover"
        accessibilityLabel="Shadab Restaurant & Grill grand opening — Chicago, you're not ready for this! Under new ownership, Deccan Group of Restaurants."
      />

      <View style={styles.inner}>
        <View style={styles.factsRow}>
          <View style={styles.fact}>
            <Ionicons name="calendar-outline" size={22} color={colors.gold} />
            <View>
              <Text style={styles.factLabel}>{live ? 'Now open' : 'Grand opening'}</Text>
              <Text style={styles.factValue}>{formatOpeningDate(GRAND_OPENING_START)}</Text>
            </View>
          </View>
          <View style={styles.fact}>
            <Ionicons name="time-outline" size={22} color={colors.gold} />
            <View>
              <Text style={styles.factLabel}>Dinner starts</Text>
              <Text style={styles.factValue}>6:00 PM</Text>
            </View>
          </View>
          <View style={styles.fact}>
            <Text style={styles.badge24}>24</Text>
            <Text style={styles.factLabelWide}>The first Indian 24-hour restaurant in Metro Chicago</Text>
          </View>
        </View>

        <View style={styles.ribbon}>
          <Text style={styles.ribbonText}>Special pricing for the first week of grand opening!</Text>
        </View>

        <BuffetPriceCards meals={meals} />

        <View style={styles.highlights}>
          {BUFFET_HIGHLIGHTS.map((h) => (
            <View key={h.label} style={styles.highlight}>
              <Ionicons name={h.icon} size={18} color={colors.gold} />
              <Text style={styles.highlightText}>{h.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.mutton}>
          <Text style={styles.muttonTitle}>Mutton Specialties Highlights</Text>
          <Text style={styles.muttonList}>{MUTTON_SPECIALTIES.join('  ·  ')}</Text>
          <Text style={styles.muttonMore}>
            Seafood · Chicken · Vegetarian specialties — and many more items!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/reservation' as never)}
          accessibilityRole="button"
          accessibilityLabel="Reserve your seating now for confirmed dine-in"
        >
          <Ionicons name="calendar" size={20} color={colors.white} />
          <View>
            <Text style={styles.ctaText}>Reserve your seating now</Text>
            <Text style={styles.ctaSub}>For confirmed dine-in</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
  },
  factsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  fact: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, maxWidth: 280 },
  factLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  factLabelWide: { flex: 1, fontFamily: fonts.sansMedium, color: colors.white, fontSize: 13, lineHeight: 18 },
  factValue: { fontFamily: fonts.sansBold, color: colors.white, fontSize: 17 },
  badge24: {
    width: 40,
    height: 40,
    lineHeight: 36,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.gold,
    textAlign: 'center',
    fontFamily: fonts.sansBold,
    color: colors.goldLight,
    fontSize: 16,
  },
  ribbon: {
    backgroundColor: '#9b1c1c',
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  ribbonText: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  highlightText: { fontFamily: fonts.sansMedium, color: colors.white, fontSize: 12 },
  mutton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  muttonTitle: {
    fontFamily: fonts.serif,
    color: colors.background,
    fontSize: 18,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  muttonList: { fontFamily: fonts.sansMedium, color: colors.background, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  muttonMore: { fontFamily: fonts.sans, color: colors.background, fontSize: 12, textAlign: 'center' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#b91c1c',
    borderWidth: 2,
    borderColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
  ctaText: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ctaSub: { fontFamily: fonts.sansBold, color: colors.goldLight, fontSize: 13, textTransform: 'uppercase' },
})
