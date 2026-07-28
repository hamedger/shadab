import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fonts } from '../../constants/theme'
import { MenuQuickFilter } from '../../lib/menuUtils'

interface MenuToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  quickFilter: MenuQuickFilter
  onQuickFilterChange: (f: MenuQuickFilter) => void
  resultCount?: number
}

const FILTERS: { id: MenuQuickFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bestseller', label: 'Bestsellers' },
  { id: 'signature', label: 'Signatures' },
  { id: 'vegetarian', label: 'Vegetarian' },
]

export function MenuToolbar({
  search,
  onSearchChange,
  quickFilter,
  onQuickFilterChange,
  resultCount,
}: MenuToolbarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.goldDark} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search the menu"
          placeholderTextColor={colors.whiteMuted}
          value={search}
          onChangeText={onSearchChange}
          returnKeyType="search"
          accessibilityLabel="Search menu"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} accessibilityLabel="Clear search">
            <Ionicons name="close" size={16} color={colors.whiteMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f, i) => (
          <React.Fragment key={f.id}>
            {i > 0 && <Text style={styles.sep}>·</Text>}
            <TouchableOpacity onPress={() => onQuickFilterChange(f.id)}>
              <Text style={[styles.filterText, quickFilter === f.id && styles.filterActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>

      {search.length > 0 && resultCount !== undefined && (
        <Text style={styles.meta}>
          {resultCount} {resultCount === 1 ? 'dish' : 'dishes'} found
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  filterText: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  filterActive: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
  },
  sep: {
    color: colors.borderStrong,
    fontSize: 13,
  },
  meta: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
})
