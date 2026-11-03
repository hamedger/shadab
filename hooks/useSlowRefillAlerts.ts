import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { playBuffetRefillChime } from '../lib/admin/kitchenChime'
import { REFILL_SLOW_MINUTES, REFILL_SLOW_SECONDS } from '../lib/admin/refillAnalytics'
import { isBuffetDishNeedsRefill } from '../lib/services/buffetService'
import { BuffetConfig } from '../types/buffet'
import { STATIC_LOCATIONS } from '../constants/staticLocations'

export interface SlowRefill {
  key: string
  locationId: string
  dishName: string
  waitingSeconds: number
}

interface OpenRefill {
  key: string
  locationId: string
  dishName: string
  requestedAt: number
}

const TICK_MS = 15_000

function notifySlowRefill(refill: SlowRefill) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  new Notification('Slow buffet refill', {
    body: `${refill.dishName} has waited over ${REFILL_SLOW_MINUTES} min for a refill`,
    tag: `buffet-refill-slow-${refill.key}`,
    requireInteraction: true,
  })
}

/**
 * Refills open longer than REFILL_SLOW_MINUTES, across all locations, updated live.
 * Chimes and sends a browser notification once per refill when it crosses the threshold.
 */
export function useSlowRefillAlerts(enabled: boolean): SlowRefill[] {
  const [openByLocation, setOpenByLocation] = useState<Record<string, OpenRefill[]>>({})
  const [now, setNow] = useState(() => Date.now())
  const alertedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled) return
    const unsubs = STATIC_LOCATIONS.map((location) =>
      onSnapshot(
        doc(db, 'buffet', location.id),
        (snap) => {
          const config = snap.exists() ? (snap.data() as BuffetConfig) : null
          const open: OpenRefill[] = (config?.todaysDishes ?? [])
            .filter((d) => isBuffetDishNeedsRefill(d) && d.refillRequestedAt)
            .map((d) => ({
              key: d.refillEventId ?? `${location.id}:${d.menuItemId}:${d.refillRequestedAt}`,
              locationId: location.id,
              dishName: d.name,
              requestedAt: d.refillRequestedAt as number,
            }))
          setOpenByLocation((prev) => ({ ...prev, [location.id]: open }))
        },
        () => {
          // Listener errors (e.g. signed out) just clear the banner.
          setOpenByLocation((prev) => ({ ...prev, [location.id]: [] }))
        },
      ),
    )
    const interval = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => {
      unsubs.forEach((u) => u())
      clearInterval(interval)
    }
  }, [enabled])

  const slow = useMemo(
    () =>
      Object.values(openByLocation)
        .flat()
        .map((r) => ({
          key: r.key,
          locationId: r.locationId,
          dishName: r.dishName,
          waitingSeconds: Math.round((now - r.requestedAt) / 1000),
        }))
        .filter((r) => r.waitingSeconds >= REFILL_SLOW_SECONDS)
        .sort((a, b) => b.waitingSeconds - a.waitingSeconds),
    [openByLocation, now],
  )

  useEffect(() => {
    const current = new Set(slow.map((r) => r.key))
    let chimed = false
    for (const refill of slow) {
      if (alertedRef.current.has(refill.key)) continue
      alertedRef.current.add(refill.key)
      if (Platform.OS === 'web') {
        if (!chimed) playBuffetRefillChime()
        chimed = true
        notifySlowRefill(refill)
      }
    }
    // Forget refills that were restocked so a future refill of the same dish alerts again.
    for (const key of alertedRef.current) {
      if (!current.has(key)) alertedRef.current.delete(key)
    }
  }, [slow])

  return slow
}
