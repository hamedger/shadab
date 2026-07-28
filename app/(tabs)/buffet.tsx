import React, { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useBuffet } from '../../hooks/useBuffet'
import { useSelectedLocation } from '../../hooks/useSelectedLocation'
import { formatLocationShort } from '../../lib/locationUtils'
import { HalalBadge } from '../../components/brand/HalalBadge'
import { PageIntro } from '../../components/layout/PageIntro'
import { BuffetMenuBySection } from '../../components/buffet/BuffetMenuBySection'
import { groupBuffetDishesForCustomer } from '../../lib/buffetLayout'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

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
    weekdayPrice,
    weekendPrice,
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
    ? `Now Open — ${currentSession === 'lunch' ? 'Lunch' : 'Dinner'} Service`
    : countdownMinutes
    ? `Opens in ${Math.floor(countdownMinutes / 60)}h ${countdownMinutes % 60}m`
    : nextSessionLabel

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.halalBar}>
        <HalalBadge size="sm" />
        <Text style={styles.halalText}>
          100% Zabiha Halal · {location ? formatLocationShort(location) : 'Michigan'}
        </Text>
      </View>

      <PageIntro
        eyebrow="Daily Royal Feast"
        title="The Buffet"
        subtitle="Twenty authentic Hyderabadi dishes, refreshed daily. Lunch and dinner service, seven days a week."
      />

      <View style={styles.statusWrap}>
        <StatusBadge isOpen={isOpen} label={statusLabel} />
        {specialNote ? <Text style={styles.specialNote}>{specialNote}</Text> : null}
      </View>

      <View style={styles.pricingRow}>
        <View style={styles.priceCard}>
          <Text style={styles.priceEyebrow}>Weekday</Text>
          <Text style={styles.priceDays}>Monday – Friday</Text>
          <Text style={styles.priceValue}>{formatCents(weekdayPrice)}</Text>
          <Text style={styles.priceUnit}>per guest</Text>
          <Text style={styles.priceHours}>11 AM – 3 PM · 5 PM – 9 PM</Text>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/reservation' as never)}>
            <Text style={styles.outlineBtnText}>Reserve</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.priceCard, styles.priceCardFeatured]}>
          <Text style={styles.featuredTag}>Popular</Text>
          <Text style={styles.priceEyebrow}>Weekend</Text>
          <Text style={styles.priceDays}>Saturday</Text>
          <Text style={[styles.priceValue, styles.priceValueGold]}>{formatCents(weekendPrice)}</Text>
          <Text style={styles.priceUnit}>per guest</Text>
          <Text style={styles.priceHours}>11 AM – 3 PM · 5 PM – 9 PM</Text>
          <TouchableOpacity style={styles.goldBtn} onPress={() => router.push('/reservation' as never)}>
            <Text style={styles.goldBtnText}>Reserve</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.noteBlock}>
        <Text style={styles.noteLine}>Children under 5 dine free</Text>
        <Text style={styles.noteLine}>Children 5–10 receive half price</Text>
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
        <Text style={styles.ctaNote}>Walk-ins welcome · Reservations recommended for parties of six or more</Text>
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
  pricingRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.lg },
  priceCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  priceCardFeatured: { borderColor: colors.borderStrong },
  featuredTag: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  priceEyebrow: { fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  priceDays: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12, marginTop: 4, marginBottom: spacing.sm },
  priceValue: { fontFamily: fonts.display, color: colors.white, fontSize: 36, lineHeight: 40 },
  priceValueGold: { color: colors.goldBright },
  priceUnit: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12 },
  priceHours: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 11, marginTop: spacing.sm, textAlign: 'center', lineHeight: 16 },
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
