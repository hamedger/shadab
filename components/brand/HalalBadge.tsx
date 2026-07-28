import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../constants/theme'

interface HalalBadgeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showPercent?: boolean
}

export function HalalBadge({ size = 'md', showPercent = false }: HalalBadgeProps) {
  const padding =
    size === 'sm'
      ? { horizontal: 8, vertical: 3 }
      : size === 'xl'
        ? { horizontal: 20, vertical: 10 }
        : size === 'lg'
          ? { horizontal: 16, vertical: 8 }
          : { horizontal: 12, vertical: 5 }
  const fontSize = size === 'sm' ? 9 : size === 'xl' ? 18 : size === 'lg' ? 14 : 11
  const label = showPercent ? '☽ 100% ZABIHA HALAL' : '☽ ZABIHA HALAL'

  return (
    <View style={[styles.badge, { paddingHorizontal: padding.horizontal, paddingVertical: padding.vertical }]}>
      <Text style={[styles.text, { fontSize }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: 'rgba(67, 160, 71, 0.12)',
  },
  text: {
    color: colors.greenLight,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})
