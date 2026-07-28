const ORDERS_LAST_VISITED_KEY = 'deccan_admin_orders_last_visited'
const DELIVERIES_LAST_VISITED_KEY = 'deccan_admin_deliveries_last_visited'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readTimestamp(key: string): number | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeTimestamp(key: string, value: number): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // ignore quota / private mode
  }
}

export function readOrdersLastVisited(): number | null {
  return readTimestamp(ORDERS_LAST_VISITED_KEY)
}

export function writeOrdersLastVisited(value: number): void {
  writeTimestamp(ORDERS_LAST_VISITED_KEY, value)
}

export function readDeliveriesLastVisited(): number | null {
  return readTimestamp(DELIVERIES_LAST_VISITED_KEY)
}

export function writeDeliveriesLastVisited(value: number): void {
  writeTimestamp(DELIVERIES_LAST_VISITED_KEY, value)
}
