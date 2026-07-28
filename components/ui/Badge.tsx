import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../constants/theme'

type BadgeVariant = 'gold' | 'green' | 'red' | 'muted'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

export function Badge({ label, variant = 'gold', size = 'sm' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], size === 'md' && styles.sizeMd]}>
      <Text style={[styles.text, styles[`text_${variant}`], size === 'md' && styles.textMd]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  sizeMd: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  gold: { backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)' },
  green: { backgroundColor: 'rgba(67,160,71,0.15)', borderWidth: 1, borderColor: colors.green },
  red: { backgroundColor: 'rgba(239,83,80,0.15)', borderWidth: 1, borderColor: colors.error },
  muted: { backgroundColor: 'rgba(240,232,213,0.08)' },
  text: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  textMd: { fontSize: 11 },
  text_gold: { color: colors.goldLight },
  text_green: { color: colors.greenLight },
  text_red: { color: colors.error },
  text_muted: { color: colors.whiteMuted },
})
