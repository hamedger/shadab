import React from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing } from '../../constants/theme'

interface HomeButtonProps {
  inHeader?: boolean
}

export function HomeButton({ inHeader }: HomeButtonProps) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={[styles.btn, inHeader && styles.headerBtn]}
      onPress={() => router.push('/(tabs)/' as never)}
      accessibilityRole="button"
      accessibilityLabel="Go to home"
    >
      <Ionicons name="home-outline" size={22} color={colors.gold} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    padding: spacing.sm,
  },
  headerBtn: {
    marginLeft: spacing.xs,
  },
})
