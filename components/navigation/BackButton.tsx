import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fonts } from '../../constants/theme'

interface BackButtonProps {
  label?: string
  fallbackHref?: `/${string}`
  inHeader?: boolean
}

export function BackButton({
  label,
  fallbackHref = '/(tabs)/menu',
  inHeader,
}: BackButtonProps) {
  const router = useRouter()

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace(fallbackHref as never)
    }
  }

  return (
    <TouchableOpacity
      style={[styles.btn, inHeader && styles.headerBtn]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label ? `Back to ${label}` : 'Go back'}
    >
      <Ionicons name="chevron-back" size={22} color={colors.gold} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: 2,
  },
  headerBtn: {
    marginLeft: spacing.xs,
  },
  label: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 15,
  },
})
