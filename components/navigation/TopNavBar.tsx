import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Link, useRouter, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { HeaderPhones } from './HeaderPhones'
import { useCartStore } from '../../store/cartStore'
import { CartBadge } from '../cart/CartBadge'
import { colors, fonts, spacing } from '../../constants/theme'

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/buffet', label: 'Buffet' },
  { href: '/locations', label: 'Locations' },
  { href: '/reservation', label: 'Reservations' },
  { href: '/catering', label: 'Catering' },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/' || pathname === '/index'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function TopNavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Text style={styles.wordmark}>Shadab</Text>
      </View>

      <View style={styles.center}>
        {NAV_LINKS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link key={item.href} href={item.href as never} asChild>
              <TouchableOpacity style={styles.linkWrap} accessibilityRole="link">
                <Text style={[styles.link, active && styles.linkActive]}>{item.label}</Text>
                <View style={[styles.underline, active && styles.underlineActive]} />
              </TouchableOpacity>
            </Link>
          )
        })}
      </View>

      <View style={styles.right}>
        <HeaderPhones />
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push('/(tabs)/orders' as never)}
          accessibilityRole="button"
          accessibilityLabel="Your orders"
        >
          <Ionicons name="receipt-outline" size={20} color={colors.gold} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push('/(tabs)/profile' as never)}
          accessibilityRole="button"
          accessibilityLabel="Your profile"
        >
          <Ionicons name="person-outline" size={20} color={colors.gold} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push('/(tabs)/cart' as never)}
          accessibilityRole="button"
          accessibilityLabel={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
        >
          <Ionicons name="cart-outline" size={20} color={colors.background} />
          <Text style={styles.cartLabel}>Order Online</Text>
          {itemCount > 0 && <CartBadge count={itemCount} />}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 84,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: 22,
    letterSpacing: 0.5,
    color: colors.gold,
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  linkWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  link: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.whiteMuted,
  },
  linkActive: {
    color: colors.gold,
  },
  underline: {
    marginTop: 6,
    height: 2,
    width: '60%',
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: colors.gold,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    padding: spacing.sm,
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 9999,
    marginLeft: spacing.xs,
  },
  cartLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.background,
  },
})
