import React, { useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { getIdTokenResult } from 'firebase/auth'
import { useAuthStore } from '../../store/authStore'
import {
  isAdminUser,
  DEFAULT_ADMIN_EMAIL,
  signInWithAdminCredentials,
  signOutAdmin,
} from '../../lib/adminAuth'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { auth, isFirebaseConfigured } from '../../lib/firebase'
import { colors, spacing, fonts, borderRadius } from '../../constants/theme'
import { Input, PasswordInput } from '../ui/Input'
import { Button } from '../ui/Button'
import { Logo } from '../brand/Logo'

interface AdminGateProps {
  children: React.ReactNode
}

export function AdminGate({ children }: AdminGateProps) {
  const router = useRouter()
  const firebaseUser = useAuthStore((s) => s.firebaseUser)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const isLoading = useAuthStore((s) => s.isLoading)
  const setAdmin = useAuthStore((s) => s.setAdmin)
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser)

  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentUser = firebaseUser ?? auth.currentUser
  const isSignedInAdmin = !!currentUser && isAdmin

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  if (!isFirebaseConfigured) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Firebase not configured</Text>
        <Text style={styles.subtitle}>Add Firebase keys to .env and restart the app.</Text>
      </View>
    )
  }

  if (!isSignedInAdmin) {
    const handleLogin = async () => {
      setError('')
      setLoading(true)
      try {
        const user = await signInWithAdminCredentials(email, password)
        const token = await getIdTokenResult(user)
        const admin = isAdminUser(user, token.claims)
        setFirebaseUser(user)
        setAdmin(admin)
        setPassword('')
      } catch (e) {
        setError(getAuthErrorMessage(e, { admin: true }))
      } finally {
        setLoading(false)
      }
    }

    return (
      <View style={styles.centered}>
        <Logo variant="full" height={56} style={{ marginBottom: spacing.xl }} />
        <Text style={styles.title}>Admin Login</Text>
        <Text style={styles.subtitle}>
          Sign in with your Firebase Authentication admin account.
        </Text>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="admin@shadab.com"
          />
          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            onSubmitEditing={handleLogin}
          />
          <Button label="Sign In" onPress={handleLogin} loading={loading} fullWidth size="lg" />
          <Button
            label="Back to App"
            variant="ghost"
            onPress={() => router.replace('/(tabs)' as never)}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </View>
    )
  }

  return <>{children}</>
}

export async function adminSignOut() {
  await signOutAdmin()
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
