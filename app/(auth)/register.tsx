import React, { useState } from 'react'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../../lib/firebase'
import { getAuthErrorMessage, getExistingAccountMessage } from '../../lib/authErrors'
import { getFirestoreErrorMessage, isFirestorePermissionDenied } from '../../lib/firestoreErrors'
import { Logo } from '../../components/brand/Logo'
import { Input, PasswordInput } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AuthScreen } from '../../components/auth/AuthScreen'
import { colors, spacing } from '../../constants/theme'
import { buildAuthReturnRoute, isCheckoutReturn } from '../../lib/authReturnTo'
import { alertUser } from '../../lib/alertUser'
import { syncUserProfileAfterAuth } from '../../lib/finishAuthSession'

export default function RegisterScreen() {
  const router = useRouter()
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showSignInLink, setShowSignInLink] = useState(false)

  const completeNewAccount = async (
    cred: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>,
  ) => {
    await updateProfile(cred.user, { displayName: name })
    try {
      await sendEmailVerification(cred.user)
    } catch {
      // Non-blocking — account is still usable without verification email.
    }
    await syncUserProfileAfterAuth(cred.user, {
      email: email.trim(),
      phone,
      displayName: name,
      isGuest: false,
    })
    router.replace(buildAuthReturnRoute(returnTo, isCheckoutReturn(returnTo)) as never)
  }

  const handleRegister = async () => {
    setFormError(null)
    setShowSignInLink(false)

    if (!name || !email || !password) {
      const message = 'Name, email, and password are required.'
      setFormError(message)
      alertUser('Missing fields', message)
      return
    }
    if (password.length < 6) {
      const message = 'Password must be at least 6 characters.'
      setFormError(message)
      alertUser('Weak password', message)
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
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await completeNewAccount(cred)
    } catch (e) {
      if (e instanceof FirebaseError && e.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
          await updateProfile(cred.user, { displayName: name })
          await syncUserProfileAfterAuth(cred.user, {
            email: email.trim(),
            phone,
            displayName: name,
            isGuest: false,
          })
          router.replace(buildAuthReturnRoute(returnTo, isCheckoutReturn(returnTo)) as never)
          return
        } catch (signInError) {
          const message =
            signInError instanceof FirebaseError &&
            (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/wrong-password')
              ? getExistingAccountMessage()
              : getAuthErrorMessage(signInError)
          setFormError(message)
          setShowSignInLink(true)
          alertUser('Account already exists', message)
          return
        }
      }

      const message = isFirestorePermissionDenied(e)
        ? getFirestoreErrorMessage(e)
        : getAuthErrorMessage(e)
      setFormError(message)
      alertUser('Registration Failed', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreen>
      <Logo variant="full" height={64} style={{ alignSelf: 'center', marginBottom: spacing.xl }} />

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.sub}>Join Shadab for exclusive rewards</Text>

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your name" />
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@email.com" />
      <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+1 (555) 000-0000" />
      <PasswordInput label="Password" value={password} onChangeText={setPassword} placeholder="Min. 6 characters" />

      <Button label="Create Account" onPress={handleRegister} loading={loading} fullWidth size="lg" />

      {showSignInLink ? (
        <TouchableOpacity
          style={styles.link}
          onPress={() =>
            router.replace({
              pathname: '/(auth)/login',
              params: returnTo ? { returnTo } : undefined,
            } as never)
          }
        >
          <Text style={styles.linkText}>Go to sign in or reset your password</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.link}
          onPress={() =>
            router.push({
              pathname: '/(auth)/login',
              params: returnTo ? { returnTo } : undefined,
            } as never)
          }
        >
          <Text style={styles.linkText}>Already have an account? <Text style={styles.bold}>Sign In</Text></Text>
        </TouchableOpacity>
      )}
    </AuthScreen>
  )
}

const styles = StyleSheet.create({
  title: { color: colors.white, fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { color: colors.whiteMuted, fontSize: 14, marginBottom: spacing.xl },
  formError: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  link: { marginTop: spacing.md, alignItems: 'center' },
  linkText: { color: colors.whiteMuted, fontSize: 14 },
  bold: { color: colors.gold, fontWeight: '700' },
})
