import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useBuffet } from '../../hooks/useBuffet'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function BuffetBanner() {
  const router = useRouter()
  const { isOpen, currentPrice, nextSessionLabel, countdownMinutes, isLoading } = useBuffet()

  const pulse = useSharedValue(1)

  useEffect(() => {
    if (isOpen) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        true,
      )
    } else {
      pulse.value = 1
    }
  }, [isOpen])

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))

  if (isLoading) return null

  const label = isOpen
    ? `Buffet Open Now — ${formatCents(currentPrice)}/person`
    : countdownMinutes
    ? `Opens in ${Math.floor(countdownMinutes / 60)}h ${countdownMinutes % 60}m`
    : nextSessionLabel

  return (
    <TouchableOpacity
      style={[styles.banner, isOpen ? styles.bannerOpen : styles.bannerClosed]}
      onPress={() => router.push('/(tabs)/buffet' as any)}
      activeOpacity={0.85}
    >
      <Animated.View style={[styles.dot, isOpen ? styles.dotOpen : styles.dotClosed, dotStyle]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  bannerOpen: {
    backgroundColor: colors.background,
    borderColor: 'rgba(67,160,71,0.4)',
  },
  bannerClosed: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotOpen: { backgroundColor: colors.greenLight },
  dotClosed: { backgroundColor: colors.goldDark },
  label: { flex: 1, fontFamily: fonts.sansMedium, color: colors.white, fontSize: 13 },
  arrow: { fontFamily: fonts.displayLight, color: colors.gold, fontSize: 22 },
})
