import { RESTAURANT_PHONE } from '../../constants/config'
import { formatPhoneDisplay } from '../../lib/locationUtils'
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Modal, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCartStore } from '../../store/cartStore'
import {
  clearCheckoutContext,
  confirmCloverOrderAfterRedirect,
} from '../../lib/services/cloverCheckout'
import { readOwnReservationStatus } from '../../lib/services/reservationCheckout'
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
  const [tone, setTone] = useState<'checking' | 'success' | 'warning'>('checking')

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

    setTone('checking')
    setMessage('checking')
    clearCart()
    clearCheckoutContext()
    router.replace('/(tabs)/' as never)

    void (async () => {
      // Reservations: read the guest's own reservation from Firestore. Orders: ask the function.
      let kind: 'order' | 'reservation' | null =
        orderIdParam && (await readOwnReservationStatus(orderIdParam)) ? 'reservation' : null
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
            const r = orderIdParam ? await readOwnReservationStatus(orderIdParam) : null
            if (r?.reservationId) {
              kind = 'reservation'
              if (r.status === 'cancelled') {
                finalMessage = `This reservation was cancelled — please call ${formatPhoneDisplay(RESTAURANT_PHONE)} if you were charged.`
                break
              }
              if (r.status === 'confirmed') {
                finalMessage =
                  `Deposit received — you're booked! Reservation #${r.reservationId.slice(-6).toUpperCase()}, ${r.date} at ${r.time}. We've texted your confirmation. ` +
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

      setTone(finalMessage && !finalMessage.startsWith('This reservation was cancelled') ? 'success' : 'warning')
      setMessage(
        finalMessage ??
          `We haven't received Clover's payment confirmation for your ${pendingKind ?? 'order'} yet. ` +
            `If you completed payment it will be confirmed shortly — questions? Call ${formatPhoneDisplay(RESTAURANT_PHONE)}.`,
      )
    })()
    // No cleanup: router.replace above drops session_id and re-runs this effect, which must not
    // stop the poll (handledRef already prevents a second run).
  }, [params.session_id, params.orderId, clearCart, router])

  if (!message) return null

  const title =
    tone === 'checking' ? 'Confirming your payment…' : tone === 'success' ? 'You\'re all set!' : 'Payment not confirmed yet'

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setMessage(null)}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityRole="alert">
          {tone === 'checking' ? (
            <ActivityIndicator size="large" color={colors.gold} />
          ) : (
            <Ionicons
              name={tone === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={56}
              color={tone === 'success' ? colors.green : colors.gold}
            />
          )}
          <Text style={styles.title}>{title}</Text>
          {tone !== 'checking' ? <Text style={styles.message}>{message}</Text> : null}
          {tone !== 'checking' ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setMessage(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 24,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: fonts.sansBold,
    color: colors.background,
    fontSize: 16,
  },
})
