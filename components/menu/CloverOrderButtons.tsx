import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Modal, ActivityIndicator, Platform } from 'react-native'
import { Button } from '../ui/Button'
import { openCloverOnlineOrdering } from '../../lib/onlineOrdering'
import { colors, spacing, fonts } from '../../constants/theme'

const STALL_TIMEOUT_MS = 6000

/** Warms up the connection to the Clover domain before the customer even clicks. */
function usePreconnect(orderingUrl: string) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    let origin: string
    try {
      origin = new URL(orderingUrl).origin
    } catch {
      return
    }
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = origin
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [orderingUrl])
}

/**
 * Pickup / Delivery entry points for Clover Online Ordering. Both open the same
 * store — Clover only lets customers pick the order type inside its cart, so the
 * Delivery button carries a note telling them to switch it there.
 */
export function CloverOrderButtons({ orderingUrl }: { orderingUrl: string }) {
  const [redirecting, setRedirecting] = useState(false)
  const [stalled, setStalled] = useState(false)
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  usePreconnect(orderingUrl)

  useEffect(() => {
    return () => {
      if (stallTimer.current) clearTimeout(stallTimer.current)
    }
  }, [])

  const openClover = () => {
    setRedirecting(true)
    setStalled(false)
    stallTimer.current = setTimeout(() => setStalled(true), STALL_TIMEOUT_MS)
    // Defer the actual navigation one frame so the overlay paints first —
    // window.location.assign can otherwise fire before React flushes the state update.
    requestAnimationFrame(() => openCloverOnlineOrdering(orderingUrl))
  }

  return (
    <>
      <View style={styles.row}>
        <View style={styles.option}>
          <Button label="Order Pickup" onPress={openClover} size="lg" loading={redirecting} />
        </View>
        <View style={styles.option}>
          <Button
            label="Order Delivery"
            onPress={openClover}
            size="lg"
            variant="secondary"
            loading={redirecting}
          />
          <Text style={styles.note}>Select Delivery in your Clover cart</Text>
        </View>
      </View>

      <Modal visible={redirecting} transparent animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.overlayText}>Taking you to online ordering…</Text>
          {stalled && (
            <>
              <Text style={styles.stalledText}>Still working on it — almost there.</Text>
              <Button label="Continue" onPress={openClover} size="md" style={styles.stalledButton} />
            </>
          )}
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  option: {
    flexGrow: 1,
    flexBasis: 160,
  },
  note: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.whiteMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  overlayText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.white,
  },
  stalledText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.whiteMuted,
    textAlign: 'center',
  },
  stalledButton: {
    marginTop: spacing.sm,
  },
})
