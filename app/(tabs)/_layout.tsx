import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Platform, Text, View, useWindowDimensions } from 'react-native'
import { TabHomeIcon } from '../../components/navigation/TabHomeIcon'
import { TopNavBar } from '../../components/navigation/TopNavBar'
import { HalalBadge } from '../../components/brand/HalalBadge'
import { blurActiveElementOnWeb } from '../../lib/a11y'
import { colors, fonts, spacing } from '../../constants/theme'
import { useCartStore } from '../../store/cartStore'
import { CartBadge } from '../../components/cart/CartBadge'
import { LocationGate } from '../../components/location/LocationGate'
import { HeaderPhones } from '../../components/navigation/HeaderPhones'

/** Below this width, web falls back to the bottom tab bar (no room for a full top nav). */
const WIDE_WEB_NAV_BREAKPOINT = 760

export default function TabLayout() {
  const itemCount = useCartStore((s) => s.itemCount())
  const { width } = useWindowDimensions()
  const logoHeight =
    Platform.OS === 'web' ? Math.min(76, Math.max(60, Math.round(width * 0.05) + 4)) : 56
  const isWideWeb = Platform.OS === 'web' && width >= WIDE_WEB_NAV_BREAKPOINT

  return (
    <LocationGate>
    <Tabs
      detachInactiveScreens={Platform.OS !== 'web'}
      screenListeners={{
        tabPress: () => {
          blurActiveElementOnWeb()
        },
      }}
      screenOptions={{
        tabBarStyle: isWideWeb
          ? { display: 'none' }
          : {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 80 : 60,
              paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.whiteMuted,
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 10 },
        headerStyle: {
          backgroundColor: colors.background,
          ...(Platform.OS === 'web' ? { height: isWideWeb ? 84 : logoHeight + 24 } : null),
        },
        headerShadowVisible: false,
        headerTitle: '',
        ...(isWideWeb
          ? {
              header: () => <TopNavBar />,
            }
          : {
              headerLeft: () => (
                <View style={{ paddingLeft: spacing.md, gap: 3 }}>
                  <Text style={{ fontFamily: fonts.serif, fontSize: 20, color: colors.gold }}>
                    Shadab
                  </Text>
                  <HalalBadge size="sm" showPercent />
                </View>
              ),
              headerRight: () => <HeaderPhones />,
            }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, size }) => <TabHomeIcon focused={focused} size={size} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: 'Our Locations',
          tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="buffet"
        options={{
          title: 'Buffet',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="cart" size={size} color={color} />
              {itemCount > 0 && <CartBadge count={itemCount} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
    </LocationGate>
  )
}
