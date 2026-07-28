import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRevenueAccessStore } from '../../store/revenueAccessStore'
import { isRevenuePasswordConfigured } from '../../lib/revenueAccess'
import { colors, spacing, fonts, borderRadius } from '../../constants/theme'
import { PasswordInput } from '../ui/Input'
import { Button } from '../ui/Button'

interface RevenueGateProps {
  children: React.ReactNode
}

export function RevenueGate({ children }: RevenueGateProps) {
  const hydrate = useRevenueAccessStore((s) => s.hydrate)
  const unlocked = useRevenueAccessStore((s) => s.unlocked)
  const hasHydrated = useRevenueAccessStore((s) => s.hasHydrated)
  const unlock = useRevenueAccessStore((s) => s.unlock)

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hasHydrated) {
    return null
  }

  if (unlocked) {
    return <>{children}</>
  }

  const handleUnlock = () => {
    setError('')
    setLoading(true)
    const ok = unlock(password)
    if (!ok) {
      setError('Incorrect password')
      setPassword('')
    }
    setLoading(false)
  }

  return (
    <View style={styles.centered}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed" size={28} color={colors.gold} />
      </View>
      <Text style={styles.title}>Revenue Access</Text>
      <Text style={styles.subtitle}>
        {isRevenuePasswordConfigured()
          ? 'Enter the revenue password to view sales and financial insights.'
          : 'Revenue password is not configured. Set EXPO_PUBLIC_ADMIN_REVENUE_PASSWORD in .env.'}
      </Text>

      {isRevenuePasswordConfigured() ? (
        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PasswordInput
            label="Revenue password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            onSubmitEditing={handleUnlock}
          />
          <Button
            label="Unlock Revenue"
            onPress={handleUnlock}
            loading={loading}
            fullWidth
            size="lg"
            disabled={!password}
          />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 360,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  form: {
    width: '100%',
    maxWidth: 360,
    marginTop: spacing.lg,
  },
  title: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 360,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 83, 80, 0.12)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: fonts.sans,
    color: colors.error,
    fontSize: 13,
    lineHeight: 20,
  },
})
