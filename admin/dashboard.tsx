import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'
import { Order } from '../types/order'
import { colors, spacing, borderRadius } from '../constants/theme'

export default function AdminDashboard() {
  const router = useRouter()
  const { isAdmin } = useAuthStore()
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!isAdmin) return
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10))
    return onSnapshot(q, (snap) => {
      setRecentOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)))
    })
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notAdmin}>Admin access required</Text>
      </View>
    )
  }

  const activeOrders = recentOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status))

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Admin Dashboard</Text>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Active Orders" value={activeOrders.length} />
        <StatCard label="Today's Orders" value={recentOrders.length} />
      </View>

      {/* Nav Links */}
      <View style={styles.navGrid}>
        {ADMIN_SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.navCard}
            onPress={() => router.push(s.route as any)}
          >
            <Text style={styles.navIcon}>{s.icon}</Text>
            <Text style={styles.navLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Live Orders */}
      <Text style={styles.sectionTitle}>Live Orders</Text>
      {activeOrders.map((order) => (
        <TouchableOpacity
          key={order.id}
          style={styles.orderRow}
          onPress={() => router.push(`/admin/orders` as any)}
        >
          <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderStatus}>{order.status.toUpperCase()}</Text>
          <Text style={styles.orderTotal}>${(order.total / 100).toFixed(2)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const ADMIN_SECTIONS = [
  { label: 'Orders', icon: '📋', route: '/admin/orders' },
  { label: 'Menu Editor', icon: '✏️', route: '/admin/menu-editor' },
  { label: 'Buffet', icon: '🍽️', route: '/admin/buffet-editor' },
  { label: 'Reservations', icon: '📅', route: '/admin/reservations' },
  { label: 'Customers', icon: '👥', route: '/admin/customers' },
  { label: 'Promos', icon: '🏷️', route: '/admin/promos' },
]

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notAdmin: { color: colors.error, fontSize: 16 },
  heading: { color: colors.gold, fontSize: 24, fontWeight: '800', marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.backgroundCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center' },
  statValue: { color: colors.gold, fontSize: 32, fontWeight: '800' },
  statLabel: { color: colors.whiteMuted, fontSize: 12, marginTop: 4 },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  navCard: { width: '30%', backgroundColor: colors.backgroundCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center', gap: 4 },
  navIcon: { fontSize: 24 },
  navLabel: { color: colors.white, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.backgroundCard, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  orderId: { color: colors.gold, fontWeight: '700' },
  orderStatus: { color: colors.white, fontSize: 12 },
  orderTotal: { color: colors.white, fontWeight: '700' },
})
