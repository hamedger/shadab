import React, { useEffect, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAdminOrders } from '../../hooks/useAdminOrders'
import { computeAdminStats, formatCents } from '../../lib/admin/stats'
import { StatCard } from '../../components/admin/StatCard'
import { GrowthCopilotPanel } from '../../components/admin/GrowthCopilotPanel'
import { AdminLocationFilter } from '../../components/admin/AdminLocationFilter'
import { RevenueGate } from '../../components/admin/RevenueGate'
import { useAdminLocationStore } from '../../store/adminLocationStore'
import { useRevenueAccessStore } from '../../store/revenueAccessStore'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

function RevenueContent() {
  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const lock = useRevenueAccessStore((s) => s.lock)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const { orders, loading } = useAdminOrders(150, filterLocationId ?? undefined)
  const stats = useMemo(() => computeAdminStats(orders), [orders])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Revenue</Text>
          <Text style={styles.subheading}>Sales performance and growth insights</Text>
        </View>
        <TouchableOpacity style={styles.lockBtn} onPress={lock} hitSlop={8}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.whiteMuted} />
          <Text style={styles.lockBtnText}>Lock</Text>
        </TouchableOpacity>
      </View>

      <AdminLocationFilter />
      <GrowthCopilotPanel />

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Revenue Today" value={formatCents(stats.revenueTodayCents)} />
            <StatCard label="Orders Today" value={String(stats.ordersToday)} />
            <StatCard label="Active Orders" value={String(stats.activeOrders)} />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              label="7-Day Revenue"
              value={formatCents(stats.revenueWeekCents)}
              hint={`${stats.ordersWeek} orders`}
            />
            <StatCard
              label="Avg Order Value"
              value={formatCents(stats.avgOrderValueCents)}
              hint="Last 7 days"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Sellers</Text>
              <Text style={styles.sectionHint}>Last 7 days</Text>
            </View>
            {stats.bestsellers.length === 0 ? (
              <Text style={styles.empty}>No order data yet.</Text>
            ) : (
              stats.bestsellers.map((item, idx) => (
                <View key={item.menuItemId} style={styles.rankRow}>
                  <Text style={styles.rank}>{idx + 1}</Text>
                  <Text style={styles.rankName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rankQty}>{item.quantity} sold</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

export default function AdminRevenueScreen() {
  return (
    <RevenueGate>
      <RevenueContent />
    </RevenueGate>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heading: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 28,
  },
  subheading: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lockBtnText: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  section: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
  },
  sectionHint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
  },
  empty: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    width: 20,
  },
  rankName: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 14,
  },
  rankQty: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
  },
})
