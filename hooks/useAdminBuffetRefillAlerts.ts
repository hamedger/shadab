import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { playBuffetRefillChime } from '../lib/admin/kitchenChime'
import {
  BuffetRefillSnapshot,
  shouldAlertForBuffetRefill,
  showBrowserBuffetRefillNotification,
  snapshotBuffetDishForRefillAlerts,
} from '../lib/admin/buffetRefillAlerts'
import { BuffetConfig } from '../types/buffet'
import { STATIC_LOCATIONS } from '../constants/staticLocations'

function locationNameForId(locationId: string): string {
  const match = STATIC_LOCATIONS.find((l) => l.id === locationId)
  if (!match) return locationId
  return match.name.replace(/^Shadab — /, '')
}

export function useAdminBuffetRefillAlerts(enabled: boolean) {
  const readyRef = useRef(false)
  const previousRef = useRef<Map<string, BuffetRefillSnapshot>>(new Map())
  const alertedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return

    const unsubs = STATIC_LOCATIONS.map((location) =>
      onSnapshot(doc(db, 'buffet', location.id), (snap) => {
        if (!snap.exists()) return
        const config = snap.data() as BuffetConfig
        const locationId = location.id

        for (const dish of config.todaysDishes ?? []) {
          const key = `${locationId}:${dish.menuItemId}`
          const snapshot = snapshotBuffetDishForRefillAlerts(dish)

          if (!readyRef.current) {
            previousRef.current.set(key, snapshot)
            continue
          }

          if (alertedRef.current.has(key) && snapshot.needsRefill) {
            previousRef.current.set(key, snapshot)
            continue
          }

          const previous = previousRef.current.get(key)
          if (!shouldAlertForBuffetRefill(previous, dish)) {
            previousRef.current.set(key, snapshot)
            if (!snapshot.needsRefill) alertedRef.current.delete(key)
            continue
          }

          alertedRef.current.add(key)
          previousRef.current.set(key, snapshot)
          playBuffetRefillChime()
          showBrowserBuffetRefillNotification(locationId, locationNameForId(locationId), dish)
        }
      }),
    )

    const seedTimer =
      typeof window !== 'undefined'
        ? window.setTimeout(() => {
            readyRef.current = true
          }, 0)
        : 0

    if (typeof window === 'undefined') {
      readyRef.current = true
    }

    return () => {
      if (typeof window !== 'undefined') window.clearTimeout(seedTimer)
      readyRef.current = false
      previousRef.current.clear()
      alertedRef.current.clear()
      unsubs.forEach((unsub) => unsub())
    }
  }, [enabled])
}
