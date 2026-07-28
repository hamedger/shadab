import React from 'react'
import { View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { MenuItem } from '../../types/menu'
import { SPICE_LABELS } from '../../constants/menu'
import { resolveMenuItemImage } from '../../lib/menuImages'
import { isMenuItemOrderable } from '../../lib/menuMerge'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface MenuDishEntryProps {
  item: MenuItem
  onAdd: () => void
}

function buildMeta(item: MenuItem): string {
  const parts: string[] = []
  if (item.tags.includes('bestseller')) parts.push('Bestseller')
  if (item.tags.includes('signature')) parts.push('Signature')
  if (item.isVegetarian) parts.push('Vegetarian')
  if (item.spiceLevel >= 2) parts.push(SPICE_LABELS[item.spiceLevel])
  return parts.join('  ·  ')
}

export function MenuDishEntry({ item, onAdd }: MenuDishEntryProps) {
  const router = useRouter()
  const orderable = isMenuItemOrderable(item)
  const meta = buildMeta(item)
  const price = `$${(item.price / 100).toFixed(2)}`
  const imageUri = resolveMenuItemImage(item)

  const openDetail = () => router.push(`/menu/${item.id}` as never)

  return (
    <View style={[styles.entry, !orderable && styles.entryOut]}>
      <Pressable
        style={styles.main}
        onPress={openDetail}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${price}`}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          accessibilityIgnoresInvertColors
        />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, !orderable && styles.nameOut]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.price, !orderable && styles.priceOut]}>{price}</Text>
          </View>

          {!orderable ? <Text style={styles.soldOut}>Out of stock</Text> : null}

          {item.description ? (
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          ) : null}

          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
      </Pressable>

      {orderable ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAdd}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.name}`}
        >
          <Text style={styles.addLabel}>Add</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.addButton}>
          <Text style={styles.unavailableLabel}>Unavailable</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  entryOut: {
    opacity: 0.72,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  name: {
    flex: 1,
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 17,
    lineHeight: 22,
  },
  nameOut: {
    color: colors.whiteMuted,
  },
  price: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  priceOut: {
    color: colors.whiteMuted,
  },
  soldOut: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  meta: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  addButton: {
    paddingBottom: 2,
    minWidth: 40,
    alignItems: 'flex-end',
  },
  addLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  unavailableLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
})
