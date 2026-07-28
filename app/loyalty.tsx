import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useLoyalty } from '../hooks/useLoyalty'
import { HalalBadge } from '../components/brand/HalalBadge'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'
import { LOYALTY } from '../constants/config'

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#d4af37',
  platinum: '#e5e4e2',
}

const REWARDS = [
  { points: 500, label: '$5 off your order' },
  { points: 1000, label: '$10 off your order' },
  { points: 1500, label: 'Free Biryani' },
  { points: 2000, label: '$20 off your order' },
  { points: 3000, label: 'Free Family Meal (2 pax)' },
]

export default function LoyaltyScreen() {
  const { points, tier, pointsToNextTier, nextTierMin, dollarValue } = useLoyalty()

  return (
    <ScrollView style={styles.container}>
      {/* Tier Card */}
      <View style={[styles.tierCard, { borderColor: TIER_COLORS[tier] }]}>
        <Text style={[styles.tierLabel, { color: TIER_COLORS[tier] }]}>{tier.toUpperCase()} MEMBER</Text>
        <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
        <Text style={styles.pointsUnit}>loyalty points</Text>
        <Text style={styles.dollarValue}>= ${dollarValue(points).toFixed(2)} value</Text>
        {pointsToNextTier && nextTierMin && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {
              width: `${Math.min(100, (points / nextTierMin) * 100)}%`,
              backgroundColor: TIER_COLORS[tier],
            }]} />
          </View>
        )}
        {pointsToNextTier && (
          <Text style={styles.nextTier}>{pointsToNextTier} pts to next tier</Text>
        )}
      </View>

      {/* How to Earn */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Earn Points</Text>
        <EarnRow label="Every $1 spent (subtotal)" value="1 pt" />
        <EarnRow label="Welcome bonus (new account)" value="100 pts" />
        <Text style={styles.comingSoon}>
          Coming soon: birthday bonus, referrals, reviews & social shares
        </Text>
      </View>

      {/* Rewards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rewards</Text>
        {REWARDS.map((r) => (
          <View key={r.points} style={[styles.rewardRow, points >= r.points && styles.rewardUnlocked]}>
            <View>
              <Text style={styles.rewardLabel}>{r.label}</Text>
              <Text style={styles.rewardPoints}>{r.points.toLocaleString()} pts</Text>
            </View>
            <Text style={[styles.rewardStatus, points >= r.points ? styles.unlocked : styles.locked]}>
              {points >= r.points ? '✓ Unlocked' : 'Locked'}
            </Text>
          </View>
        ))}
      </View>

      {/* Tiers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tiers</Text>
        {Object.entries(LOYALTY.tiers).map(([name, { min, max }]) => (
          <View key={name} style={styles.tierRow}>
            <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[name as keyof typeof TIER_COLORS] }]} />
            <Text style={styles.tierName}>{name.charAt(0).toUpperCase() + name.slice(1)}</Text>
            <Text style={styles.tierRange}>
              {max === Infinity ? `${min.toLocaleString()}+ pts` : `${min.toLocaleString()}–${max.toLocaleString()} pts`}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function EarnRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.earnRow}>
      <Text style={styles.earnLabel}>{label}</Text>
      <Text style={styles.earnValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tierCard: {
    margin: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
  },
  tierLabel: { fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 2, marginBottom: spacing.sm },
  pointsValue: { fontFamily: fonts.display, color: colors.white, fontSize: 52 },
  pointsUnit: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 14, marginTop: 2 },
  dollarValue: { fontFamily: fonts.sansBold, color: colors.gold, fontSize: 16, marginTop: 4 },
  progressBar: { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  nextTier: { color: colors.whiteMuted, fontSize: 12, marginTop: 6 },
  section: { margin: spacing.md },
  sectionTitle: { fontFamily: fonts.serif, color: colors.white, fontSize: 18, marginBottom: spacing.sm },
  earnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  earnLabel: { color: colors.white, fontSize: 14 },
  earnValue: { color: colors.gold, fontWeight: '700', fontSize: 14 },
  comingSoon: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  rewardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.backgroundCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  rewardUnlocked: { borderColor: colors.borderStrong },
  rewardLabel: { color: colors.white, fontSize: 14, fontWeight: '600' },
  rewardPoints: { color: colors.gold, fontSize: 12, marginTop: 2 },
  rewardStatus: { fontSize: 12, fontWeight: '700' },
  unlocked: { color: colors.greenLight },
  locked: { color: colors.whiteMuted },
  tierRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tierDot: { width: 12, height: 12, borderRadius: 6 },
  tierName: { color: colors.white, fontSize: 14, fontWeight: '600', flex: 1 },
  tierRange: { color: colors.whiteMuted, fontSize: 12 },
})
