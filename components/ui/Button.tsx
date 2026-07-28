import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native'
import { colors, borderRadius, spacing } from '../../constants/theme'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  fullWidth?: boolean
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.background : colors.gold} size="small" />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.gold,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error,
  },
  size_sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  size_md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  size_lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
  label: { fontWeight: '700', letterSpacing: 0.5 },
  label_primary: { color: colors.background },
  label_secondary: { color: colors.gold },
  label_ghost: { color: colors.gold },
  label_danger: { color: colors.white },
  labelSize_sm: { fontSize: 12 },
  labelSize_md: { fontSize: 14 },
  labelSize_lg: { fontSize: 16 },
})
