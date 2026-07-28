import React, { useState } from 'react'
import { Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { User } from '../../types/user'
import { Logo } from '../../components/brand/Logo'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AuthScreen } from '../../components/auth/AuthScreen'
import { colors, spacing } from '../../constants/theme'
import { alertUser } from '../../lib/alertUser'
import { getAuthErrorMessage } from '../../lib/authErrors'
import { buildAuthReturnRoute, isCheckoutReturn } from '../../lib/authReturnTo'
import { signInForGuestCheckout } from '../../lib/guestAuth'
import { ensureGuestProfile } from '../../lib/guestProfile'

function buildGuestProfile(uid: string, name: string, email: string, phone: string): User {
  return {
    uid,
    email: email.trim(),
    phone: phone.trim(),
    displayName: name.trim(),
    photoURL: '',
    isGuest: true,
    addresses: [],
    defaultAddressId: '',
    loyaltyPoints: 0,
    loyaltyTier: 'bronze',
    totalOrderCount: 0,
    totalSpend: 0,
    dietaryPreferences: [],
    pushToken: '',
    createdAt: null as unknown as User['createdAt'],
    updatedAt: null as unknown as User['updatedAt'],
  }
}

export default function GuestScreen() {
  const router = useRouter()
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const setUserProfile = useAuthStore((s) => s.setUserProfile)
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showSignInLink, setShowSignInLink] = useState(false)

  const handleContinue = async () => {
    setFormError(null)
    setShowSignInLink(false)

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setFormError('Please enter your name, email, and phone number.')
      return
    }

    setLoading(true)
    try {
      const cred = await signInForGuestCheckout(name.trim(), email.trim())
      await cred.user.getIdToken(true)
      setFirebaseUser(cred.user)

      const guestProfile = buildGuestProfile(cred.user.uid, name, email, phone)
      const saved = await ensureGuestProfile(cred.user.uid, {
        email: email.trim(),
        phone: phone.trim(),
        displayName: name.trim(),
      })

      if (saved) {
        const snap = await getDoc(doc(db, 'users', cred.user.uid))
        setUserProfile(snap.exists() ? (snap.data() as User) : guestProfile)
      } else {
        setUserProfile(guestProfile)
      }

      router.replace(buildAuthReturnRoute(returnTo, isCheckoutReturn(returnTo)) as never)
    } catch (e: unknown) {
      const message = getAuthErrorMessage(e)
      setFormError(message)
      setShowSignInLink(message.includes('already exists'))
      alertUser('Guest Checkout Failed', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreen>
      <Logo variant="full" height={64} style={{ alignSelf: 'center', marginBottom: spacing.xl }} />
      <Text style={styles.title}>Guest Checkout</Text>
      <Text style={styles.sub}>We need your details to send order updates and payment receipt</Text>

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your name" />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="for order receipt"
      />
      <Input
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="for pickup updates"
      />

      <Button
        label="Continue to Checkout"
        onPress={handleContinue}
        loading={loading}
        fullWidth
        size="lg"
      />

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
          <Text style={styles.linkText}>Sign in with this email instead</Text>
        </TouchableOpacity>
      ) : null}
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
  linkText: { color: colors.gold, fontSize: 14, fontWeight: '700' },
})
