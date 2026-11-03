import React from 'react'
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAdminBuffetRefillAlerts } from '../../hooks/useAdminBuffetRefillAlerts'
import { useSlowRefillAlerts } from '../../hooks/useSlowRefillAlerts'
import { REFILL_SLOW_MINUTES, formatRefillDuration } from '../../lib/admin/refillAnalytics'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

/**
 * Plays a kitchen chime and browser notification when floor staff flag a buffet item for refill,
 * and shows a banner on every admin screen while a refill has waited past REFILL_SLOW_MINUTES.
 */
export function AdminBuffetRefillAlerts() {
  const enabled = Platform.OS === 'web'
  useAdminBuffetRefillAlerts(enabled)
  const slow = useSlowRefillAlerts(true)
  const router = useRouter()

  if (slow.length === 0) return null

  const summary = slow
    .slice(0, 3)
    .map((r) => `${r.dishName} (${formatRefillDuration(r.waitingSeconds)})`)
    .join(' · ')
  const more = slow.length > 3 ? ` +${slow.length - 3} more` : ''

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={() => router.push('/admin/refills' as never)}
      accessibilityRole="button"
      accessibilityLabel={`${slow.length} slow refills. Open refill analytics.`}
    >
      <Ionicons name="alert-circle" size={20} color="#ffffff" />
      <View style={styles.body}>
        <Text style={styles.title}>
          {slow.length === 1 ? 'Refill waiting' : `${slow.length} refills waiting`} over {REFILL_SLOW_MINUTES} min
        </Text>
        <Text style={styles.detail}>
          {summary}
          {more}
        </Text>
      </View>
      <Text style={styles.link}>View →</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.sansBold, color: '#ffffff', fontSize: 14 },
  detail: { fontFamily: fonts.sans, color: '#ffffff', fontSize: 13 },
  link: { fontFamily: fonts.sansBold, color: '#ffffff', fontSize: 13 },
})
