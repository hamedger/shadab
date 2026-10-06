import React, { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useBuffet } from '../../hooks/useBuffet'
import { useSelectedLocation } from '../../hooks/useSelectedLocation'
import { formatLocationShort } from '../../lib/locationUtils'
import { HalalBadge } from '../../components/brand/HalalBadge'
import { PageIntro } from '../../components/layout/PageIntro'
import { BuffetMenuBySection } from '../../components/buffet/BuffetMenuBySection'
import { GrandOpeningBanner } from '../../components/shared/GrandOpeningBanner'
import { groupBuffetDishesForCustomer } from '../../lib/buffetLayout'
import { BuffetPriceCards } from '../../components/buffet/BuffetPriceCards'
import {
  BUFFET_MEALS,
  isGrandOpeningWindow,
  MUTTON_SPECIALTIES,
  STUDENT_BUFFET_DISCOUNT_PERCENT,
} from '../../constants/buffet'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

function StatusBadge({ isOpen, label }: { isOpen: boolean; label: string }) {
  return (
    <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
      <View style={[styles.statusDot, { backgroundColor: isOpen ? colors.greenLight : colors.goldDark }]} />
      <Text style={[styles.statusText, { color: isOpen ? colors.greenLight : colors.goldLight }]}>
        {label}
      </Text>
    </View>
  )
}

export default function BuffetScreen() {
  const router = useRouter()
  const { location } = useSelectedLocation()
  const {
    isOpen,
    currentSession,
    meals,
    nextSessionLabel,
    countdownMinutes,
    todaysDishes,
    specialNote,
  } = useBuffet(location?.id)

  const buffetSections = useMemo(
    () => groupBuffetDishesForCustomer(todaysDishes),
    [todaysDishes],
  )

  const statusLabel = isOpen
    ? `Now Open — ${currentSession ? BUFFET_MEALS[currentSession].label : ''} Buffet`
    : countdownMinutes
    ? `Opens in ${Math.floor(countdownMinutes / 60)}h ${countdownMinutes % 60}m`
    : nextSessionLabel

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.halalBar}>
        <HalalBadge size="sm" />
        <Text style={styles.halalText}>
          100% Zabiha Halal · {location ? formatLocationShort(location) : 'Chicago'}
        </Text>
      </View>

      <PageIntro
        eyebrow="Daily Royal Feast"
        title="The Buffet"
        subtitle="Breakfast, lunch, and a 40+ item dinner buffet — every day of the week. Open 24 hours for dine-in and online orders."
      />

      <View style={styles.statusWrap}>
        <StatusBadge isOpen={isOpen} label={statusLabel} />
        {specialNote ? <Text style={styles.specialNote}>{specialNote}</Text> : null}
      </View>

      <GrandOpeningBanner />

      <View style={styles.pricingRow}>
        {isGrandOpeningWindow() ? <Text style={styles.featuredTag}>Grand Opening Special</Text> : null}
        <BuffetPriceCards meals={meals} currentMeal={currentSession} />
        <TouchableOpacity style={[styles.goldBtn, styles.pricingCta]} onPress={() => router.push('/reservation' as never)}>
          <Text style={styles.goldBtnText}>Reserve</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.noteBlock}>
        <Text style={styles.noteLine}>Children under 5 dine free</Text>
        <Text style={styles.noteLine}>Children 5–10 receive half price</Text>
        <Text style={styles.noteLine}>Students save {STUDENT_BUFFET_DISCOUNT_PERCENT}% with valid ID</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mutton Specialties</Text>
        <View style={styles.sectionRule} />
        <Text style={styles.includedText}>{MUTTON_SPECIALTIES.join(' · ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today&apos;s Selection</Text>
        <View style={styles.sectionRule} />
        <BuffetMenuBySection sections={buffetSections} />
        <Text style={styles.rotatesNote}>Menu rotates daily</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Included With Buffet</Text>
        <View style={styles.sectionRule} />
        <Text style={styles.includedText}>
          Unlimited servings · Fresh naan & rice · Raita · Salad · Dessert · Soft drinks
        </Text>
        <View style={styles.halalRow}><HalalBadge size="md" /></View>
      </View>

      <View style={styles.ctaSection}>
        <TouchableOpacity style={styles.goldBtnWide} onPress={() => router.push('/reservation' as never)}>
          <Text style={styles.goldBtnText}>Reserve Your Table</Text>
        </TouchableOpacity>
        <Text style={styles.ctaNote}>We highly recommend everyone reserve — no reservation = seating not guaranteed</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  halalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  halalText: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12 },
  statusWrap: { alignItems: 'center', paddingBottom: spacing.lg },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing.sm,
  },
  statusOpen: { borderColor: 'rgba(67,160,71,0.4)', backgroundColor: 'rgba(67,160,71,0.08)' },
  statusClosed: { borderColor: colors.border, backgroundColor: 'rgba(212,175,55,0.06)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: fonts.sansMedium, fontSize: 13 },
  specialNote: { fontFamily: fonts.sans, color: colors.goldLight, fontSize: 13, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.lg },
  pricingRow: { paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.lg, alignItems: 'center' },
  pricingCta: { alignSelf: 'center' },
  featuredTag: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  outlineBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: borderRadius.sm,
  },
  outlineBtnText: { fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  goldBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.sm,
  },
  goldBtnWide: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.sm,
  },
  goldBtnText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 14, letterSpacing: 0.5 },
  noteBlock: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 4,
    marginBottom: spacing.lg,
  },
  noteLine: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 13, textAlign: 'center' },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionTitle: { fontFamily: fonts.display, color: colors.gold, fontSize: 26, lineHeight: 30 },
  sectionRule: { width: 48, height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  rotatesNote: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12, marginTop: spacing.md, textAlign: 'center' },
  includedText: { fontFamily: fonts.sans, color: colors.white, fontSize: 14, lineHeight: 22 },
  halalRow: { marginTop: spacing.md },
  ctaSection: { marginHorizontal: spacing.lg, marginBottom: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  ctaNote: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
})
