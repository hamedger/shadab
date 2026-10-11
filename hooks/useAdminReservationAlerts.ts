import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { useAdminReservations } from './useAdminReservations'
import { playReservationChime } from '../lib/admin/kitchenChime'
import {
  ReservationAlertSnapshot,
  shouldAlertForNewReservation,
  showBrowserReservationNotification,
  snapshotReservationForAlerts,
} from '../lib/admin/reservationAlerts'

export function useAdminReservationAlerts(enabled: boolean) {
  const { reservations, loading } = useAdminReservations(50)
  const readyRef = useRef(false)
  const previousRef = useRef<Map<string, ReservationAlertSnapshot>>(new Map())
  const alertedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || loading) return

    // First load: remember what's already there so only bookings made from now on chime.
    if (!readyRef.current) {
      for (const r of reservations) previousRef.current.set(r.id, snapshotReservationForAlerts(r))
      readyRef.current = true
      return
    }

    for (const r of reservations) {
      const previous = previousRef.current.get(r.id)
      previousRef.current.set(r.id, snapshotReservationForAlerts(r))
      if (alertedRef.current.has(r.id) || !shouldAlertForNewReservation(previous, r)) continue

      alertedRef.current.add(r.id)
      playReservationChime()
      showBrowserReservationNotification(r)
    }
  }, [reservations, loading, enabled])
}
