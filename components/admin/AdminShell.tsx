import React, { useEffect, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { signOutAdmin } from '../../lib/adminAuth'
import { useRevenueAccessStore } from '../../store/revenueAccessStore'
import { useAdminLocationStore } from '../../store/adminLocationStore'
import { useAdminNavAlertStore } from '../../store/adminNavAlertStore'
import { useAdminOrders } from '../../hooks/useAdminOrders'
import { isPaidOrder } from '../../lib/admin/orderAdmin'
import { Order } from '../../types/order'
import { AdminOrderAlerts } from './AdminOrderAlerts'
import { AdminReservationAlerts } from './AdminReservationAlerts'
import { AdminBuffetRefillAlerts } from './AdminBuffetRefillAlerts'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

function orderCreatedAtMillis(order: Order): number {
  const date = order.createdAt?.toDate?.()
  return date ? date.getTime() : 0
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'grid-outline' as const, exact: true },
  { href: '/admin/revenue', label: 'Revenue', icon: 'cash-outline' as const, locked: true },
  { href: '/admin/orders', label: 'Orders', icon: 'receipt-outline' as const },
  { href: '/admin/delivery', label: 'Deliveries', icon: 'bicycle-outline' as const },
  { href: '/admin/arrivals', label: 'Arrivals', icon: 'checkmark-done-outline' as const },
  { href: '/admin/reservations', label: 'Reservations', icon: 'calendar-outline' as const },
  { href: '/admin/catering', label: 'Catering', icon: 'people-outline' as const },
  { href: '/admin/locations', label: 'Locations', icon: 'location-outline' as const },
  { href: '/admin/menu', label: 'Menu', icon: 'restaurant-outline' as const },
  { href: '/admin/buffet', label: 'Buffet', icon: 'fast-food-outline' as const },
]

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { width } = useWindowDimensions()
  const wide = width >= 900
  const hydrateRevenueAccess = useRevenueAccessStore((s) => s.hydrate)
  const revenueUnlocked = useRevenueAccessStore((s) => s.unlocked)
  const lockRevenue = useRevenueAccessStore((s) => s.lock)
  const hydrateLocationFilter = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const { orders, customerProfiles, loading } = useAdminOrders(150, filterLocationId ?? undefined)
  const hydrateNavAlerts = useAdminNavAlertStore((s) => s.hydrate)
  const lastVisitedOrdersAt = useAdminNavAlertStore((s) => s.lastVisitedOrdersAt)
  const lastVisitedDeliveriesAt = useAdminNavAlertStore((s) => s.lastVisitedDeliveriesAt)
  const navAlertsHydrated = useAdminNavAlertStore((s) => s.hasHydrated)

  useEffect(() => {
    hydrateRevenueAccess()
  }, [hydrateRevenueAccess])

  useEffect(() => {
    hydrateLocationFilter()
  }, [hydrateLocationFilter])

  useEffect(() => {
    hydrateNavAlerts()
  }, [hydrateNavAlerts])

  const newOrdersCount = useMemo(() => {
    if (!navAlertsHydrated) return 0
    return orders.filter(
      (o) =>
        isPaidOrder(o) &&
        o.status !== 'cancelled' &&
        orderCreatedAtMillis(o) > lastVisitedOrdersAt,
    ).length
  }, [orders, lastVisitedOrdersAt, navAlertsHydrated])

  const newDeliveriesCount = useMemo(() => {
    if (!navAlertsHydrated) return 0
    return orders.filter(
      (o) =>
        o.fulfillmentType === 'delivery' &&
        isPaidOrder(o) &&
        o.status !== 'cancelled' &&
        orderCreatedAtMillis(o) > lastVisitedDeliveriesAt,
    ).length
  }, [orders, lastVisitedDeliveriesAt, navAlertsHydrated])

  const navBadges: Record<string, number> = {
    '/admin/orders': newOrdersCount,
    '/admin/delivery': newDeliveriesCount,
  }

  const handleSignOut = async () => {
    lockRevenue()
    await signOutAdmin()
    router.replace('/(tabs)' as never)
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href || pathname === `${href}/`
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const nav = (
    <View style={[styles.nav, wide ? styles.navSide : styles.navTop]}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>Admin</Text>
        <View style={styles.brandActions}>
          <TouchableOpacity onPress={handleSignOut} hitSlop={8}>
            <Text style={styles.signOutLink}>Sign out</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)' as never)} hitSlop={8}>
            <Text style={styles.backLink}>← App</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal={!wide}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={wide ? styles.navListVertical : styles.navListHorizontal}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact)
          const badge = navBadges[item.href] ?? 0
          return (
            <TouchableOpacity
              key={item.href}
              style={[styles.navItem, active && styles.navItemActive, !wide && styles.navItemCompact]}
              onPress={() => router.push(item.href as never)}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={active ? colors.gold : colors.whiteMuted}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              {'locked' in item && item.locked && !revenueUnlocked ? (
                <Ionicons name="lock-closed" size={12} color={colors.whiteMuted} />
              ) : null}
              {badge > 0 ? (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )

  return (
    <View style={[styles.root, wide && styles.rootWide]}>
      {nav}
      <View style={styles.content}>
        <AdminOrderAlerts
          orders={orders}
          loading={loading}
          customerProfiles={customerProfiles}
        />
        <AdminBuffetRefillAlerts />
        <AdminReservationAlerts />
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  rootWide: {
    flexDirection: 'row',
  },
  nav: {
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  navSide: {
    width: 220,
    borderRightWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  navTop: {
    borderBottomWidth: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  brandActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signOutLink: {
    fontFamily: fonts.sansMedium,
    color: colors.error,
    fontSize: 11,
  },
  brand: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 20,
  },
  backLink: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 12,
  },
  navListVertical: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  navListHorizontal: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  navItemCompact: {
    paddingHorizontal: spacing.md,
  },
  navItemActive: {
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  navLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 14,
  },
  navLabelActive: {
    color: colors.gold,
  },
  navBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBadgeText: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 11,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
})
