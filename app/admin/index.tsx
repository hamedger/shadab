import React, { useEffect, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAdminOrders } from '../../hooks/useAdminOrders'
import { computeAdminStats, formatCents, formatOrderTime } from '../../lib/admin/stats'
import { ORDER_STATUS_LABELS, isOrderActive, isPaidOrder } from '../../lib/admin/orderAdmin'
import { StatCard } from '../../components/admin/StatCard'
import { AdminLocationFilter } from '../../components/admin/AdminLocationFilter'
import { useAdminLocationStore } from '../../store/adminLocationStore'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

export default function AdminDashboardScreen() {
  const router = useRouter()
  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const hasHydrated = useAdminLocationStore((s) => s.hasHydrated)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const { orders, loading: ordersLoading } = useAdminOrders(150, filterLocationId ?? undefined)
  const loading = ordersLoading || !hasHydrated

  const stats = useMemo(() => computeAdminStats(orders), [orders])
  const liveOrders = orders
    .filter((o) => isPaidOrder(o) && isOrderActive(o))
    .slice(0, 8)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.subheading}>Live operations overview</Text>

      <AdminLocationFilter />

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Orders Today" value={String(stats.ordersToday)} />
            <StatCard label="Active Orders" value={String(stats.activeOrders)} />
            <StatCard
              label="7-Day Orders"
              value={String(stats.ordersWeek)}
              hint="Excludes cancelled"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Live Orders</Text>
              <TouchableOpacity onPress={() => router.push('/admin/orders' as never)}>
                <Text style={styles.link}>View all →</Text>
              </TouchableOpacity>
            </View>
            {liveOrders.length === 0 ? (
              <Text style={styles.empty}>No active orders right now.</Text>
            ) : (
              liveOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderRow}
                  onPress={() => router.push('/admin/orders' as never)}
                >
                  <View>
                    <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderMeta}>{formatOrderTime(order.createdAt)}</Text>
                  </View>
                  <Text style={styles.orderStatus}>{ORDER_STATUS_LABELS[order.status]}</Text>
                  <Text style={styles.orderTotal}>{formatCents(order.total)}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
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
  heading: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 28,
  },
  subheading: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    marginBottom: spacing.sm,
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
  link: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 13,
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
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderId: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 13,
  },
  orderMeta: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    marginTop: 2,
  },
  orderStatus: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 12,
  },
  orderTotal: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 13,
  },
})
