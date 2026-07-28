import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useMenu, useMenuItem } from '../../hooks/useMenu'
import { useSelectedLocation } from '../../hooks/useSelectedLocation'
import { isMenuItemOrderable } from '../../lib/menuMerge'
import { useCartStore } from '../../store/cartStore'
import { resolveMenuItemImage } from '../../lib/menuImages'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { Badge } from '../../components/ui/Badge'
import { HalalBadge } from '../../components/brand/HalalBadge'
import { Button } from '../../components/ui/Button'
import { BackButton } from '../../components/navigation/BackButton'
import { CartNavButton } from '../../components/navigation/CartNavButton'
import { DishPhotoDisclaimer } from '../../components/menu/DishPhotoDisclaimer'

const CONTENT_MAX = 640
const SPICE_ICONS = ['', '🌶️', '🌶️🌶️', '🌶️🌶️🌶️']

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>()
  const router = useRouter()
  const { width: windowWidth } = useWindowDimensions()
  const { locationId } = useSelectedLocation()
  const { data: item, isLoading } = useMenuItem(itemId, locationId)
  const { data: menuItems = [] } = useMenu(locationId)

  const { prevId, nextId } = useMemo(() => {
    if (!item) return { prevId: null, nextId: null }
    const categoryItems = menuItems.filter((i) => i.category === item.category)
    const index = categoryItems.findIndex((i) => i.id === item.id)
    if (index < 0) return { prevId: null, nextId: null }
    return {
      prevId: index > 0 ? categoryItems[index - 1].id : null,
      nextId: index < categoryItems.length - 1 ? categoryItems[index + 1].id : null,
    }
  }, [item, menuItems])

  const cartQty = useCartStore(
    (s) => s.items.find((i) => i.menuItemId === itemId)?.quantity ?? 0,
  )
  const addItem = useCartStore((s) => s.addItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)

  const [qty, setQty] = useState(1)

  useEffect(() => {
    setQty(cartQty > 0 ? cartQty : 1)
  }, [cartQty, itemId])

  const contentWidth = Math.min(windowWidth, CONTENT_MAX)
  const arrowWidth = 40
  const imageGap = spacing.xs
  const imageInnerWidth = Math.max(200, contentWidth - arrowWidth * 2 - imageGap * 2)
  const imageHeight = Math.round(imageInnerWidth * 0.56)

  const navBar = (
    <View style={[styles.navBar, { maxWidth: CONTENT_MAX }]}>
      <BackButton label="Menu" />
      <View style={styles.navBarSpacer} />
      <CartNavButton />
    </View>
  )

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {navBar}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </View>
    )
  }

  if (!item) {
    return (
      <View style={styles.screen}>
        {navBar}
        <View style={styles.centered}>
          <Text style={styles.notFound}>Item not found</Text>
        </View>
      </View>
    )
  }

  const imageUri = resolveMenuItemImage(item)
  const unitPrice = (item.price / 100).toFixed(2)
  const lineTotal = ((item.price * qty) / 100).toFixed(2)
  const orderable = isMenuItemOrderable(item, locationId)

  const decrement = () => setQty((n) => Math.max(1, n - 1))
  const increment = () => {
    if (!orderable) return
    setQty((n) => n + 1)
  }

  const handleAddToCart = () => {
    if (!orderable) return
    if (cartQty > 0) {
      updateQuantity(item.id, qty)
    } else {
      addItem({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageURL: imageUri,
      })
      if (qty > 1) updateQuantity(item.id, qty)
    }
    router.back()
  }

  const goToItem = (id: string | null) => {
    if (!id) return
    router.replace(`/menu/${id}` as never)
  }

  return (
    <View style={styles.screen}>
      {navBar}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sheet, { maxWidth: CONTENT_MAX }]}>
          <View style={[styles.imageRow, { width: contentWidth }]}>
            <TouchableOpacity
              style={[styles.imageArrow, !prevId && styles.imageArrowDisabled]}
              onPress={() => goToItem(prevId)}
              disabled={!prevId}
              accessibilityRole="button"
              accessibilityLabel="Previous dish"
              accessibilityState={{ disabled: !prevId }}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={prevId ? colors.gold : colors.whiteMuted}
              />
            </TouchableOpacity>

            <View style={[styles.imageFrame, { width: imageInnerWidth, height: imageHeight }]}>
              <Image
                source={{ uri: imageUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                accessibilityIgnoresInvertColors
              />
            </View>

            <TouchableOpacity
              style={[styles.imageArrow, !nextId && styles.imageArrowDisabled]}
              onPress={() => goToItem(nextId)}
              disabled={!nextId}
              accessibilityRole="button"
              accessibilityLabel="Next dish"
              accessibilityState={{ disabled: !nextId }}
            >
              <Ionicons
                name="chevron-forward"
                size={28}
                color={nextId ? colors.gold : colors.whiteMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>${unitPrice}</Text>

            {!orderable ? (
              <View style={styles.soldOutRow}>
                <Badge label="OUT OF STOCK" variant="muted" size="md" />
                <Text style={styles.soldOutHint}>This item is temporarily unavailable.</Text>
              </View>
            ) : null}

            {(item.isVegetarian || item.isHalal || item.isSpicy || item.tags?.includes('bestseller')) && (
              <View style={styles.badgeRow}>
                {item.isVegetarian && <Badge label="VEG" variant="green" size="md" />}
                {item.isHalal && <HalalBadge size="sm" />}
                {item.isSpicy && (
                  <Badge label={SPICE_ICONS[item.spiceLevel]} variant="red" size="md" />
                )}
                {item.tags?.includes('bestseller') && (
                  <Badge label="BESTSELLER" variant="gold" size="md" />
                )}
              </View>
            )}

            {item.description ? (
              <Text style={styles.desc}>{item.description}</Text>
            ) : null}

            <DishPhotoDisclaimer />

            {!!item.calories && item.calories > 0 && (
              <Text style={styles.calories}>{item.calories} cal</Text>
            )}

            {item.allergens?.length > 0 && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Allergens</Text>
                <Text style={styles.infoValue}>{item.allergens.join(', ')}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={[styles.footerInner, { maxWidth: CONTENT_MAX }]}>
          {orderable ? (
            <>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
                  onPress={decrement}
                  disabled={qty <= 1}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: qty <= 1 }}
                  accessibilityLabel="Decrease quantity"
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={qty <= 1 ? colors.whiteMuted : colors.gold}
                  />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={increment}
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons name="add" size={18} color={colors.gold} />
                </TouchableOpacity>
              </View>

              <Button
                label={cartQty > 0 ? `Update Cart · $${lineTotal}` : `Add to Cart · $${lineTotal}`}
                onPress={handleAddToCart}
                size="lg"
                style={styles.addBtn}
              />
            </>
          ) : (
            <View style={styles.unavailableFooter}>
              <Text style={styles.unavailableTitle}>Out of stock</Text>
              <Text style={styles.unavailableText}>Check back later or browse other dishes.</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  navBarSpacer: {
    flex: 1,
  },
  imageRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  imageArrow: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageArrowDisabled: {
    opacity: 0.4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  sheet: {
    width: '100%',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  notFound: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 16,
  },
  imageFrame: {
    alignSelf: 'center',
    backgroundColor: colors.backgroundSecondary,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  name: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 26,
    lineHeight: 32,
  },
  price: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 22,
    letterSpacing: 0.3,
  },
  soldOutRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  soldOutHint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  desc: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 15,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  calories: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  infoBlock: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  footerInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  unavailableFooter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  unavailableTitle: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  unavailableText: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.45,
  },
  qtyValue: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 18,
    minWidth: 28,
    textAlign: 'center',
  },
  addBtn: {
    flex: 1,
  },
})
