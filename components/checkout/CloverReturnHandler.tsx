import { RESTAURANT_PHONE } from '../../constants/config'
import { formatPhoneDisplay } from '../../lib/locationUtils'
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCartStore } from '../../store/cartStore'
import {
  clearCheckoutContext,
  confirmCloverOrderAfterRedirect,
} from '../../lib/services/cloverCheckout'
import { confirmCloverReservationAfterRedirect } from '../../lib/services/reservationCheckout'
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
    // Only Clover's signed webhook marks payment, so poll until it lands (usually seconds).
    const delaysMs = [0, 2000, 3000, 5000, 5000, 10000, 10000, 15000]
    const isNotFound = (error: unknown) =>
      typeof error === 'object' && error !== null && (error as { code?: string }).code === 'functions/not-found'

    setMessage('Confirming your payment with Clover…')
    clearCart()
    clearCheckoutContext()
    router.replace('/(tabs)/' as never)

    void (async () => {
      let kind: 'order' | 'reservation' | null = null
      let finalMessage: string | null = null
      let pendingKind: 'order' | 'reservation' | null = null

      for (const delay of delaysMs) {
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))

        if (kind !== 'reservation') {
          try {
            const result = await confirmCloverOrderAfterRedirect(checkoutSessionId, orderIdParam)
            if (result?.orderId) {
              kind = 'order'
              if (result.status !== 'pending') {
                finalMessage = `Payment confirmed! Order #${formatOrderShortId(result.orderId)}`
                break
              }
              pendingKind = 'order'
              continue
            }
          } catch (error) {
            if (isNotFound(error)) kind = 'reservation'
            else if (kind === 'order') continue
          }
        }

        if (kind !== 'order') {
          try {
            const r = await confirmCloverReservationAfterRedirect(checkoutSessionId, orderIdParam)
            if (r?.reservationId) {
              kind = 'reservation'
              if (r.status !== 'pending') {
                finalMessage =
                  `Payment confirmed! Reservation #${r.reservationId.slice(-6).toUpperCase()} — ${r.date} at ${r.time}. Show your confirmation email at the host stand. ` +
                  `Need to cancel? Call ${formatPhoneDisplay(RESTAURANT_PHONE)} — deposit refunded up to 48 hours before; within 48 hours it's kept.`
                break
              }
              pendingKind = 'reservation'
            }
          } catch (error) {
            console.warn('[CloverReturn] reservation status check failed', error)
          }
        }
      }

      setMessage(
        finalMessage ??
          `We haven't received Clover's payment confirmation for your ${pendingKind ?? 'order'} yet. ` +
            `If you completed payment it will be confirmed shortly — questions? Call ${formatPhoneDisplay(RESTAURANT_PHONE)}.`,
      )
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.setTimeout(() => setMessage(null), kind === 'reservation' ? 20000 : 10000)
      }
    })()
    // No cleanup: router.replace above drops session_id and re-runs this effect, which must not
    // stop the poll (handledRef already prevents a second run).
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
