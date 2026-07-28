import React from 'react'
import { TextInput, View, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, borderRadius, spacing } from '../../constants/theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Input({ label, error, leftIcon, rightIcon, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error ? styles.inputError : styles.inputNormal]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.whiteMuted}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

interface PasswordInputProps extends Omit<InputProps, 'secureTextEntry' | 'rightIcon'> {}

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false)

  return (
    <Input
      {...props}
      secureTextEntry={!visible}
      rightIcon={
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.whiteMuted}
          />
        </TouchableOpacity>
      }
    />
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { color: colors.white, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  inputNormal: { borderColor: colors.border },
  inputError: { borderColor: colors.error },
  icon: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    paddingVertical: spacing.sm + 2,
  },
  error: { color: colors.error, fontSize: 11, marginTop: 4 },
})
