import React from 'react'
import { ScrollView, View, StyleSheet, useWindowDimensions } from 'react-native'
import { HalalBadge } from '../brand/HalalBadge'
import { HeroSection } from './HeroSection'
import { BuffetBanner } from './BuffetBanner'
import { StatsStrip } from './StatsStrip'
import { FeaturedDishes } from './FeaturedDishes'
import { ConversionSection } from './ConversionSection'
import { OrynPromoBlock } from './OrynPromoBlock'
import { DemoBanner } from '../shared/DemoBanner'
import { colors, spacing } from '../../constants/theme'

const WIDE_BREAKPOINT = 720

export function HomeScreen() {
  const { width } = useWindowDimensions()
  const isWide = width >= WIDE_BREAKPOINT

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <DemoBanner />

      <View style={[styles.announcementBar, !isWide && styles.announcementBarMobile]}>
        <HalalBadge size={isWide ? 'xl' : 'lg'} showPercent />
      </View>

      <HeroSection />
      <BuffetBanner />
      <StatsStrip />
      <FeaturedDishes />
      <OrynPromoBlock />
      <ConversionSection />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  announcementBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  announcementBarMobile: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
  },
})
