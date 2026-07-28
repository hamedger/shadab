import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCartStore } from '../../store/cartStore'
import {
  clearCheckoutContext,
  confirmCloverOrderAfterRedirect,
} from '../../lib/services/cloverCheckout'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

function formatOrderShortId(orderId: string): string {
  return orderId.slice(-6).toUpperCase()
}

/**
 * Handles return from Clover Hosted Checkout when the success URL lands on the home page
 * (or any tab route) with ?session_id=…&orderId=… query params.
 */
export function CloverReturnHandler() {
  const router = useRouter()
  const params = useGlobalSearchParams<{
    session_id?: string
    orderId?: string
    payment?: string
  }>()
  const clearCart = useCartStore((s) => s.clearCart)
  const handledRef = useRef<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkoutSessionId = params.session_id?.trim()
    if (!checkoutSessionId) return
    if (handledRef.current === checkoutSessionId) return
    handledRef.current = checkoutSessionId

    const orderIdParam = params.orderId?.trim()

    void (async () => {
      let confirmedOrderId = orderIdParam ?? ''
      try {
        const result = await confirmCloverOrderAfterRedirect(checkoutSessionId, orderIdParam)
        if (result?.orderId) confirmedOrderId = result.orderId
      } catch (error) {
        console.warn('[CloverReturn] confirmCloverOrder failed — webhook may confirm later', error)
      }

      clearCart()
      clearCheckoutContext()

      if (confirmedOrderId) {
        setMessage(`Payment confirmed! Order #${formatOrderShortId(confirmedOrderId)}`)
      } else {
        setMessage('Payment confirmed!')
      }

      router.replace('/(tabs)/' as never)

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.setTimeout(() => setMessage(null), 8000)
      }
    })()
  }, [params.session_id, params.orderId, clearCart, router])

  if (!message) return null

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="checkmark-circle" size={20} color={colors.background} />
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.sansBold,
    color: colors.background,
    fontSize: 14,
  },
})
