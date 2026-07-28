import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAdminMenu, useInvalidateAdminMenu } from '../../../hooks/useAdminMenu'
import { MENU_CATEGORIES } from '../../../constants/menu'
import { DEFAULT_LOCATION_ID } from '../../../constants/config'
import { AdminMenuItemRow } from '../../../components/admin/AdminMenuItemRow'
import { AdminLocationFilter } from '../../../components/admin/AdminLocationFilter'
import { useAdminLocationStore } from '../../../store/adminLocationStore'
import { MenuItem } from '../../../types/menu'
import { colors, spacing, borderRadius, fonts } from '../../../constants/theme'

function groupByCategory(items: MenuItem[]) {
  const map = new Map<string, MenuItem[]>()
  for (const item of items) {
    const list = map.get(item.category) ?? []
    list.push(item)
    map.set(item.category, list)
  }

  const ordered: { id: string; label: string; items: MenuItem[] }[] = []
  for (const cat of MENU_CATEGORIES) {
    const catItems = map.get(cat.id)
    if (catItems?.length) {
      ordered.push({ id: cat.id, label: cat.label, items: catItems })
      map.delete(cat.id)
    }
  }
  for (const [id, catItems] of map) {
    ordered.push({ id, label: id.replace(/-/g, ' '), items: catItems })
  }
  return ordered
}

export default function AdminMenuListScreen() {
  const router = useRouter()
  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const setFilterLocationId = useAdminLocationStore((s) => s.setFilterLocationId)
  const stockLocationId = filterLocationId ?? DEFAULT_LOCATION_ID
  const { data: items = [], isLoading } = useAdminMenu(stockLocationId)
  const invalidate = useInvalidateAdminMenu()
  const [search, setSearch] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!filterLocationId) {
      setFilterLocationId(DEFAULT_LOCATION_ID)
    }
  }, [filterLocationId, setFilterLocationId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q),
    )
  }, [items, search])

  const sections = useMemo(() => groupByCategory(filtered), [filtered])
  const soldOut = items.filter((i) => !i.isAvailable).length

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Menu</Text>
          <Text style={styles.subheading}>
            {items.length} items · stock per location
          </Text>
        </View>
        {soldOut > 0 ? (
          <View style={styles.alertPill}>
            <Text style={styles.alertText}>{soldOut} sold out</Text>
          </View>
        ) : null}
      </View>

      <AdminLocationFilter showAll={false} />

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search all menu items..."
          placeholderTextColor={colors.whiteMuted}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator>
          {sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.label}</Text>
                <Text style={styles.sectionCount}>{section.items.length}</Text>
              </View>
              <View style={styles.sectionCard}>
                {section.items.map((item) => (
                  <AdminMenuItemRow
                    key={item.id}
                    item={item}
                    locationId={stockLocationId}
                    onPress={() => router.push(`/admin/menu/${item.id}` as never)}
                    onStockChange={invalidate}
                  />
                ))}
              </View>
            </View>
          ))}
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No items match your search.</Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  heading: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 28,
  },
  subheading: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    marginTop: 4,
  },
  alertPill: {
    backgroundColor: 'rgba(239,83,80,0.15)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  alertText: {
    fontFamily: fonts.sansMedium,
    color: colors.error,
    fontSize: 11,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  search: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 14,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
  },
  sectionCount: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 12,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  empty: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
})
