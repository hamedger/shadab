import { create } from 'zustand'
import {
  readDeliveriesLastVisited,
  readOrdersLastVisited,
  writeDeliveriesLastVisited,
  writeOrdersLastVisited,
} from '../lib/adminNavAlertStorage'

interface AdminNavAlertState {
  lastVisitedOrdersAt: number
  lastVisitedDeliveriesAt: number
  hasHydrated: boolean
  hydrate: () => void
  markOrdersVisited: () => void
  markDeliveriesVisited: () => void
}

export const useAdminNavAlertStore = create<AdminNavAlertState>((set) => ({
  lastVisitedOrdersAt: Date.now(),
  lastVisitedDeliveriesAt: Date.now(),
  hasHydrated: false,

  hydrate: () => {
    const now = Date.now()
    // First-ever visit (no stored marker): treat as caught-up rather than flooding
    // the badge with every historical order, and persist that baseline.
    const orders = readOrdersLastVisited()
    const deliveries = readDeliveriesLastVisited()
    if (orders === null) writeOrdersLastVisited(now)
    if (deliveries === null) writeDeliveriesLastVisited(now)

    set({
      lastVisitedOrdersAt: orders ?? now,
      lastVisitedDeliveriesAt: deliveries ?? now,
      hasHydrated: true,
    })
  },

  markOrdersVisited: () => {
    const now = Date.now()
    writeOrdersLastVisited(now)
    set({ lastVisitedOrdersAt: now })
  },

  markDeliveriesVisited: () => {
    const now = Date.now()
    writeDeliveriesLastVisited(now)
    set({ lastVisitedDeliveriesAt: now })
  },
}))
