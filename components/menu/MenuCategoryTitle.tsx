import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fonts } from '../../constants/theme'

interface MenuCategoryTitleProps {
  title: string
  count?: number
}

export function MenuCategoryTitle({ title, count }: MenuCategoryTitleProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {count !== undefined && (
        <Text style={styles.count}>{count}</Text>
      )}
      <View style={styles.rule} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.gold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  count: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  rule: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    width: 48,
  },
})
