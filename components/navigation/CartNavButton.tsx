import React from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCartStore } from '../../store/cartStore'
import { CartBadge } from '../cart/CartBadge'
import { colors, spacing } from '../../constants/theme'

export function CartNavButton() {
  const router = useRouter()
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => router.push('/(tabs)/cart' as never)}
      accessibilityRole="button"
      accessibilityLabel={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
    >
      <View>
        <Ionicons name="cart-outline" size={22} color={colors.gold} />
        {itemCount > 0 && <CartBadge count={itemCount} />}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    padding: spacing.sm,
  },
})
