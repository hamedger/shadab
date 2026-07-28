import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { useMenu } from '../../hooks/useMenu'
import { MenuDishCard } from '../menu/MenuDishCard'
import { getMenuCardWidth } from '../../lib/menuUtils'
import { colors, spacing, fonts } from '../../constants/theme'

export function FeaturedDishes() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  // Bestsellers are the same signature dishes at every location, so this intentionally
  // doesn't filter by the selected location (unlike the Menu tab, which does).
  const { data: items = [], isLoading } = useMenu()
  const featured = items.filter((i) => i.tags?.includes('bestseller')).slice(0, 6)
  const cardWidth = getMenuCardWidth(width)

  if (isLoading || featured.length === 0) return null

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Bestsellers</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/menu' as any)}>
          <Text style={styles.seeAll}>See All →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {featured.map((item) => (
          <MenuDishCard key={item.id} item={item} width={cardWidth} />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  title: { fontFamily: fonts.serif, color: colors.white, fontSize: 18 },
  seeAll: { fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 13 },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm },
})
