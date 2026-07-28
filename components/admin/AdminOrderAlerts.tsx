import React, { useCallback, useEffect, useState } from 'react'
import { Platform, Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import { useAdminOrderAlerts } from '../../hooks/useAdminOrderAlerts'
import { playKitchenChime } from '../../lib/admin/kitchenChime'
import {
  BrowserNotificationPermission,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from '../../lib/admin/orderAlerts'
import { OrderCustomerProfile } from '../../lib/admin/orderAdmin'
import { Order } from '../../types/order'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface AdminOrderAlertsProps {
  orders: Order[]
  loading: boolean
  customerProfiles: Map<string, OrderCustomerProfile>
}

function readPermission(): BrowserNotificationPermission {
  return Platform.OS === 'web' ? getBrowserNotificationPermission() : 'unsupported'
}

/**
 * Listens for newly paid orders across admin pages and plays a kitchen chime
 * plus a browser notification (web only). Always shows alert status on web.
 */
export function AdminOrderAlerts({ orders, loading, customerProfiles }: AdminOrderAlertsProps) {
  const [permission, setPermission] = useState<BrowserNotificationPermission>(readPermission)

  const enabled = Platform.OS === 'web'

  useEffect(() => {
    if (!enabled) return
    setPermission(getBrowserNotificationPermission())

    const onFocus = () => setPermission(getBrowserNotificationPermission())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [enabled])

  useAdminOrderAlerts(orders, loading, customerProfiles, enabled)

  const enableNotifications = useCallback(async () => {
    const next = await requestBrowserNotificationPermission()
    setPermission(next)
    if (next === 'granted') playKitchenChime()
  }, [])

  if (!enabled) return null

  if (permission === 'unsupported') {
    return (
      <View style={[styles.banner, styles.bannerWarn]}>
        <Text style={styles.bannerText}>
          Browser notifications are not available in this browser. Use Chrome or Safari over HTTPS.
        </Text>
      </View>
    )
  }

  if (permission === 'granted') {
    return (
      <View style={[styles.banner, styles.bannerOk]}>
        <Text style={styles.bannerText}>
          Kitchen alerts on — chime + notifications for new orders and buffet refills.
        </Text>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => playKitchenChime()}>
          <Text style={styles.buttonSecondaryText}>Test chime</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (permission === 'denied') {
    return (
      <View style={[styles.banner, styles.bannerDenied]}>
        <Text style={styles.bannerText}>
          Notifications are blocked. Open site settings from the address bar → Notifications → Allow,
          then reload this page.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>
        Tap Enable to allow kitchen chimes and browser notifications for new paid orders and buffet
        refills.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => void enableNotifications()}>
        <Text style={styles.buttonText}>Enable</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  bannerOk: {
    borderColor: 'rgba(76,175,80,0.45)',
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  bannerWarn: {
    borderColor: 'rgba(255,193,7,0.45)',
    backgroundColor: 'rgba(255,193,7,0.1)',
  },
  bannerDenied: {
    borderColor: 'rgba(239,83,80,0.45)',
    backgroundColor: 'rgba(239,83,80,0.1)',
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gold,
  },
  buttonText: {
    fontFamily: fonts.sansBold,
    color: colors.background,
    fontSize: 12,
  },
  buttonSecondary: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  buttonSecondaryText: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 12,
  },
})
