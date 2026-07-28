import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { playKitchenChime } from '../lib/admin/kitchenChime'
import {
  OrderAlertSnapshot,
  shouldAlertForNewPaidOrder,
  showBrowserOrderNotification,
  snapshotOrderForAlerts,
} from '../lib/admin/orderAlerts'
import { resolveOrderCustomerInfo } from '../lib/admin/orderAdmin'
import { Order } from '../types/order'
import { OrderCustomerProfile } from '../lib/admin/orderAdmin'

export function useAdminOrderAlerts(
  orders: Order[],
  loading: boolean,
  customerProfiles: Map<string, OrderCustomerProfile>,
  enabled: boolean,
) {
  const readyRef = useRef(false)
  const previousRef = useRef<Map<string, OrderAlertSnapshot>>(new Map())
  const alertedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || loading) return

    if (!readyRef.current) {
      const seeded = new Map<string, OrderAlertSnapshot>()
      for (const order of orders) {
        seeded.set(order.id, snapshotOrderForAlerts(order))
      }
      previousRef.current = seeded
      readyRef.current = true
      return
    }

    for (const order of orders) {
      if (alertedRef.current.has(order.id)) {
        previousRef.current.set(order.id, snapshotOrderForAlerts(order))
        continue
      }

      const previous = previousRef.current.get(order.id)
      if (!shouldAlertForNewPaidOrder(previous, order)) {
        previousRef.current.set(order.id, snapshotOrderForAlerts(order))
        continue
      }

      alertedRef.current.add(order.id)
      previousRef.current.set(order.id, snapshotOrderForAlerts(order))

      playKitchenChime()
      const customer = resolveOrderCustomerInfo(order, customerProfiles)
      showBrowserOrderNotification(order, customer.name)
    }
  }, [orders, loading, enabled, customerProfiles])
}
