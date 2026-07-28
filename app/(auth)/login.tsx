import React, { useState } from 'react'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../../lib/firebase'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { Logo } from '../../components/brand/Logo'
import { Input, PasswordInput } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AuthScreen } from '../../components/auth/AuthScreen'
import { colors, spacing } from '../../constants/theme'
import { CHECKOUT_RETURN_PATH, buildAuthReturnRoute, isCheckoutReturn } from '../../lib/authReturnTo'
import { alertUser } from '../../lib/alertUser'
import { syncUserProfileAfterAuth } from '../../lib/finishAuthSession'

export default function LoginScreen() {
  const router = useRouter()
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const fromCheckout = returnTo === CHECKOUT_RETURN_PATH

  const handleLogin = async () => {
    setFormError(null)

    if (!email || !password) {
      const message = 'Enter your email and password.'
      setFormError(message)
      alertUser('Missing fields', message)
      return
    }
    if (!isFirebaseConfigured) {
      const message = 'Firebase is not configured. Check your .env file and restart the app.'
      setFormError(message)
      alertUser('Configuration error', message)
      return
    }
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      await syncUserProfileAfterAuth(cred.user, {
        email: email.trim(),
        displayName: cred.user.displayName ?? '',
        isGuest: false,
      })
      router.replace(buildAuthReturnRoute(returnTo, isCheckoutReturn(returnTo)) as never)
    } catch (e) {
      const message = getAuthErrorMessage(e)
      setFormError(message)
      alertUser('Login Failed', message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setFormError(null)

    if (!email.trim()) {
      const message = 'Enter your email above, then tap Forgot password again.'
      setFormError(message)
      alertUser('Enter your email', message)
      return
    }
    if (!isFirebaseConfigured) {
      alertUser('Configuration error', 'Firebase is not configured.')
      return
    }

    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      alertUser('Check your email', `We sent a password reset link to ${email.trim()}.`)
    } catch (e) {
      const message = getAuthErrorMessage(e)
      setFormError(message)
      alertUser('Could not send reset email', message)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <AuthScreen>
      <Logo variant="full" height={64} style={{ alignSelf: 'center', marginBottom: spacing.xl }} />

      <Text style={styles.title}>{fromCheckout ? 'Sign In to Pay' : 'Welcome Back'}</Text>
      <Text style={styles.sub}>
        {fromCheckout
          ? 'Sign in, register, or continue as guest to complete your order'
          : 'Sign in to your account'}
      </Text>

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@email.com"
      />
      <PasswordInput
        label="Password"
        value={password}
        onChangeText={setPassword}
      />

      <Button label="Sign In" onPress={handleLogin} loading={loading} fullWidth size="lg" />

      <TouchableOpacity style={styles.link} onPress={handleForgotPassword} disabled={resetLoading}>
        <Text style={styles.linkBold}>
          {resetLoading ? 'Sending reset email…' : 'Forgot password?'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() =>
          router.push({
            pathname: '/(auth)/register',
            params: returnTo ? { returnTo } : undefined,
          } as never)
        }
      >
        <Text style={styles.linkText}>
          Don&apos;t have an account? <Text style={styles.linkBold}>Register</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() =>
          router.push({
            pathname: '/(auth)/guest',
            params: returnTo ? { returnTo } : undefined,
          } as never)
        }
      >
        <Text style={styles.linkText}>
          Continue as <Text style={styles.linkBold}>Guest</Text>
        </Text>
      </TouchableOpacity>
    </AuthScreen>
  )
}

const styles = StyleSheet.create({
  title: { color: colors.white, fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { color: colors.whiteMuted, fontSize: 14, marginBottom: spacing.xl, textAlign: 'center' },
  formError: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  link: { marginTop: spacing.md, alignItems: 'center' },
  linkText: { color: colors.whiteMuted, fontSize: 14 },
  linkBold: { color: colors.gold, fontWeight: '700' },
})
