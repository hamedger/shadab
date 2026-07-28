import React, { useEffect, useCallback } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, usePathname } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'
import { User } from '../types/user'
import { colors } from '../constants/theme'
import { useAppFonts } from '../lib/fonts'
import { blurActiveElementOnWeb } from '../lib/a11y'
import { isAdminUser } from '../lib/adminAuth'
import { normalizeUserProfile } from '../lib/finishAuthSession'
import { HomeButton } from '../components/navigation/HomeButton'
import { CloverReturnHandler } from '../components/checkout/CloverReturnHandler'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

function AuthReadyGate({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading && isFirebaseConfigured) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  return children
}

export default function RootLayout() {
  const [fontsLoaded] = useAppFonts()
  const pathname = usePathname()
  const { setFirebaseUser, setUserProfile, setLoading, setAdmin } = useAuthStore()

  useEffect(() => {
    blurActiveElementOnWeb()
  }, [pathname])

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      try {
        if (firebaseUser) {
          const tokenResult = await getIdTokenResult(firebaseUser)
          setAdmin(isAdminUser(firebaseUser, tokenResult.claims))
          try {
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (snap.exists()) {
              const remote = normalizeUserProfile({
                uid: firebaseUser.uid,
                ...(snap.data() as Partial<User>),
              })
              const existing = useAuthStore.getState().userProfile
              if (
                existing?.uid === firebaseUser.uid &&
                existing.email?.trim() &&
                !remote.email?.trim()
              ) {
                setUserProfile(
                  normalizeUserProfile({
                    ...remote,
                    email: existing.email,
                    phone: existing.phone || remote.phone,
                    displayName: existing.displayName || remote.displayName,
                    isGuest: existing.isGuest ?? remote.isGuest,
                  }),
                )
              } else {
                setUserProfile(remote)
              }
            } else {
              const existing = useAuthStore.getState().userProfile
              if (existing?.uid !== firebaseUser.uid) {
                setUserProfile(null)
              }
            }
          } catch {
            const existing = useAuthStore.getState().userProfile
            if (existing?.uid !== firebaseUser.uid) {
              setUserProfile(null)
            }
          }
        } else {
          setUserProfile(null)
          setAdmin(false)
        }
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [])

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1 }} onLayout={onLayoutReady}>
        <StatusBar style="light" />
        <AuthReadyGate>
        <CloverReturnHandler />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.gold,
            headerTitleStyle: { color: colors.white, fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerLeft: () => <HomeButton inHeader />,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="menu/[itemId]" options={{ headerShown: false }} />
          <Stack.Screen name="checkout/index" options={{ title: 'Checkout' }} />
          <Stack.Screen name="checkout/success" options={{ title: 'Order Confirmed', headerShown: false }} />
          <Stack.Screen name="order/[orderId]" options={{ title: 'Order Tracking' }} />
          <Stack.Screen name="reservation" options={{ title: 'Reserve a Table' }} />
          <Stack.Screen name="catering" options={{ title: 'Catering Inquiry' }} />
          <Stack.Screen name="loyalty" options={{ title: 'My Rewards' }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
        </Stack>
        </AuthReadyGate>
      </View>
    </QueryClientProvider>
  )
}
