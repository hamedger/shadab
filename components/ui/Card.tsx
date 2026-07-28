import React from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { colors, borderRadius, spacing } from '../../constants/theme'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  bordered?: boolean
  padding?: keyof typeof spacing
}

export function Card({ children, style, bordered = true, padding = 'md' }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        bordered && styles.bordered,
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
})
