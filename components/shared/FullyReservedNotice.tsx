import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFullyReserved } from '../../hooks/useFullyReserved'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

export const FULLY_RESERVED_MESSAGE = 'We are fully reserved'

/** Shown while staff have switched on "Fully reserved today" in admin; renders nothing otherwise. */
export function FullyReservedNotice({ style }: { style?: StyleProp<ViewStyle> }) {
  const { fullyReservedToday } = useFullyReserved()
  if (!fullyReservedToday) return null

  return (
    <View style={[styles.box, style]} accessibilityRole="alert">
      <Ionicons name="calendar-clear-outline" size={18} color={colors.gold} />
      <Text style={styles.text}>{FULLY_RESERVED_MESSAGE}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundSecondary,
  },
  text: { fontFamily: fonts.sansBold, color: colors.gold, fontSize: 15, textAlign: 'center' },
})
