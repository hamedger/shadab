import React, { useMemo, useState, useCallback } from 'react'
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { MenuCategoryList } from './MenuCategoryList'
import { MenuToolbar } from './MenuToolbar'
import { MenuCategoryTitle } from './MenuCategoryTitle'
import { MenuDishCard } from './MenuDishCard'
import { useMenu } from '../../hooks/useMenu'
import { useSelectedLocation } from '../../hooks/useSelectedLocation'
import { MenuItem } from '../../types/menu'
import { MENU_CATEGORIES } from '../../constants/menu'
import {
  filterMenuItems,
  groupMenuByCategory,
  shouldGroupSections,
  getCategoryLabel,
  getMenuCardWidth,
  MenuQuickFilter,
} from '../../lib/menuUtils'
import { colors, spacing, fonts } from '../../constants/theme'

export function MenuCatalog() {
  const { width } = useWindowDimensions()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [quickFilter, setQuickFilter] = useState<MenuQuickFilter>('all')

  const { locationId } = useSelectedLocation()
  const { data: items = [], isLoading } = useMenu(locationId)

  const gridGap = spacing.sm
  const gridPad = spacing.md
  const cellWidth = getMenuCardWidth(width, gridPad, gridGap)

  const categoryCounts = useMemo(
    () =>
      items.reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + 1
        return acc
      }, {}),
    [items],
  )

  const filtered = useMemo(
    () => filterMenuItems(items, { search, categoryId, quickFilter }),
    [items, search, categoryId, quickFilter],
  )

  const grouped = useMemo(() => groupMenuByCategory(filtered), [filtered])
  const useSections =
    shouldGroupSections(categoryId, search, quickFilter) && grouped.length > 0

  const handleCategorySelect = useCallback((id: string | null) => {
    setCategoryId(id)
    if (id) setSearch('')
  }, [])

  const renderGrid = (dishes: MenuItem[]) => (
    <View style={[styles.grid, { gap: gridGap, paddingHorizontal: gridPad }]}>
      {dishes.map((item) => (
        <MenuDishCard key={item.id} item={item} width={cellWidth} />
      ))}
    </View>
  )

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.compactIntro}>
        <Text style={styles.menuTitle}>Our Menu</Text>
        <Text style={styles.menuMeta}>
          {MENU_CATEGORIES.length} categories · {items.length} dishes
        </Text>
      </View>
      <MenuToolbar
        search={search}
        onSearchChange={setSearch}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        resultCount={search ? filtered.length : undefined}
      />
      <MenuCategoryList
        activeCategory={categoryId}
        onSelect={handleCategorySelect}
        counts={categoryCounts}
      />
    </View>
  )

  if (isLoading) {
    return (
      <View style={styles.root}>
        {listHeader}
        <View style={[styles.loading, { paddingHorizontal: gridPad }]}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.loadingBlock}>
              <View style={styles.loadingLineLg} />
              <View style={styles.loadingLineMd} />
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={Platform.OS === 'web'}
    >
      {listHeader}

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No dishes found</Text>
          <Text style={styles.emptyText}>
            Adjust your search or explore another category from the menu.
          </Text>
        </View>
      ) : useSections ? (
        grouped.map((section) => (
          <View key={section.categoryId} style={styles.section}>
            <View style={{ paddingHorizontal: gridPad }}>
              <MenuCategoryTitle title={section.categoryLabel} count={section.items.length} />
            </View>
            {renderGrid(section.items)}
          </View>
        ))
      ) : (
        <>
          <View style={{ paddingHorizontal: gridPad }}>
            {categoryId && (
              <MenuCategoryTitle title={getCategoryLabel(categoryId)} count={filtered.length} />
            )}
            {(search || quickFilter !== 'all') && !categoryId && (
              <MenuCategoryTitle
                title={search ? 'Search Results' : 'Selected Dishes'}
                count={filtered.length}
              />
            )}
          </View>
          {renderGrid(filtered)}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { minHeight: 0 } : null),
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  header: {
    backgroundColor: colors.background,
  },
  compactIntro: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuTitle: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 22,
    lineHeight: 28,
  },
  menuMeta: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  loading: {
    paddingTop: spacing.md,
  },
  loadingBlock: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  loadingLineLg: {
    height: 16,
    width: '55%',
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  loadingLineMd: {
    height: 12,
    width: '90%',
    backgroundColor: colors.border,
    opacity: 0.6,
    borderRadius: 2,
  },
})
