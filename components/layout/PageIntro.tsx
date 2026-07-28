import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fonts } from '../../constants/theme'

interface PageIntroProps {
  eyebrow: string
  title: string
  subtitle?: string
  centered?: boolean
}

export function PageIntro({ eyebrow, title, subtitle, centered = true }: PageIntroProps) {
  return (
    <View style={[styles.wrap, centered && styles.centered]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.ornament}>
        <View style={styles.line} />
        <Text style={styles.diamond}>◆</Text>
        <View style={styles.line} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  centered: {
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.white,
    fontSize: 40,
    lineHeight: 44,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 420,
  },
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
    maxWidth: 280,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  diamond: {
    color: colors.gold,
    fontSize: 8,
  },
})
