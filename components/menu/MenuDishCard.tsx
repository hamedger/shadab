import React from 'react'
import { View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { MenuItem } from '../../types/menu'
import { resolveMenuItemImage } from '../../lib/menuImages'
import { isMenuItemOrderable } from '../../lib/menuMerge'
import { useCartStore } from '../../store/cartStore'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface MenuDishCardProps {
  item: MenuItem
  width: number
}

export function MenuDishCard({ item, width }: MenuDishCardProps) {
  const router = useRouter()
  const quantity = useCartStore(
    (s) => s.items.find((i) => i.menuItemId === item.id)?.quantity ?? 0,
  )
  const addItem = useCartStore((s) => s.addItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const orderable = isMenuItemOrderable(item)

  const price = `$${(item.price / 100).toFixed(2)}`
  const imageUri = resolveMenuItemImage(item)
  const imageHeight = Math.round(width * 0.58)

  const openDetail = () => router.push(`/menu/${item.id}` as never)

  const increment = () => {
    if (!orderable) return
    if (quantity === 0) {
      addItem({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageURL: item.imageURL,
      })
    } else {
      updateQuantity(item.id, quantity + 1)
    }
  }

  const decrement = () => updateQuantity(item.id, quantity - 1)

  return (
    <View style={[styles.card, { width }, !orderable && styles.cardOut]}>
      <Pressable
        onPress={openDetail}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${price}${orderable ? '' : ', out of stock'}`}
      >
        <View style={[styles.imageWrap, { width, height: imageHeight }]}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, { width, height: imageHeight }, !orderable && styles.imageOut]}
            contentFit="cover"
            transition={200}
            accessibilityIgnoresInvertColors
          />
          {!orderable ? (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Out of stock</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <Text style={[styles.name, !orderable && styles.nameOut]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.price, !orderable && styles.priceOut]}>{price}</Text>
            {item.tags.includes('bestseller') && <Text style={styles.badge}>★</Text>}
          </View>
        </View>
      </Pressable>

      {!orderable && quantity === 0 ? (
        <View style={styles.qtyBar}>
          <Text style={styles.unavailableLabel}>Unavailable</Text>
        </View>
      ) : (
        <View style={styles.qtyBar}>
          <TouchableOpacity
            style={[styles.qtyBtn, quantity === 0 && styles.qtyBtnDisabled]}
            onPress={decrement}
            disabled={quantity === 0}
            accessibilityRole="button"
            accessibilityState={{ disabled: quantity === 0 }}
            accessibilityLabel={`Decrease ${item.name} quantity`}
          >
            <Ionicons
              name="remove"
              size={14}
              color={quantity === 0 ? colors.whiteMuted : colors.gold}
            />
          </TouchableOpacity>
          <Text style={[styles.qty, quantity === 0 && styles.qtyZero]}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, !orderable && styles.qtyBtnDisabled]}
            onPress={increment}
            disabled={!orderable}
            accessibilityRole="button"
            accessibilityState={{ disabled: !orderable }}
            accessibilityLabel={`Increase ${item.name} quantity`}
          >
            <Ionicons
              name="add"
              size={14}
              color={orderable ? colors.gold : colors.whiteMuted}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  cardOut: {
    opacity: 0.72,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    backgroundColor: colors.backgroundSecondary,
  },
  imageOut: {
    opacity: 0.55,
  },
  soldOutBadge: {
    position: 'absolute',
    left: spacing.xs,
    right: spacing.xs,
    bottom: spacing.xs,
    backgroundColor: 'rgba(11, 9, 5, 0.88)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: 3,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  soldOutText: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  body: {
    paddingHorizontal: spacing.xs + 2,
    paddingTop: spacing.xs + 2,
    paddingBottom: spacing.xs,
    gap: 2,
  },
  name: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 11,
    lineHeight: 14,
    minHeight: 28,
  },
  nameOut: {
    color: colors.whiteMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  price: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 12,
  },
  priceOut: {
    color: colors.whiteMuted,
  },
  unavailableLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badge: {
    fontFamily: fonts.sans,
    color: colors.goldLight,
    fontSize: 10,
  },
  qtyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.xs,
    minHeight: 32,
    gap: spacing.sm,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.45,
  },
  qty: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 13,
    minWidth: 20,
    textAlign: 'center',
  },
  qtyZero: {
    color: colors.whiteMuted,
  },
})
