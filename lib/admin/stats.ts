import { startOfDay, subDays } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { Timestamp } from 'firebase/firestore'
import { Order } from '../../types/order'
import { isOrderActive, isPaidOrder } from './orderAdmin'
import { TIMEZONE } from '../../constants/config'

export interface AdminStats {
  revenueTodayCents: number
  ordersToday: number
  activeOrders: number
  revenueWeekCents: number
  ordersWeek: number
  avgOrderValueCents: number
  bestsellers: { menuItemId: string; name: string; quantity: number }[]
}

function toDate(value: Timestamp | null | undefined): Date | null {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  return null
}

function startOfTodayTz(): Date {
  const now = toZonedTime(new Date(), TIMEZONE)
  const startLocal = startOfDay(now)
  return fromZonedTime(startLocal, TIMEZONE)
}

function startOfWeekAgoTz(): Date {
  const today = startOfTodayTz()
  return subDays(today, 7)
}

export function computeAdminStats(orders: Order[]): AdminStats {
  const todayStart = startOfTodayTz()
  const weekStart = startOfWeekAgoTz()

  let revenueTodayCents = 0
  let ordersToday = 0
  let revenueWeekCents = 0
  let ordersWeek = 0
  let activeOrders = 0

  const itemCounts = new Map<string, { name: string; quantity: number }>()

  for (const order of orders) {
    if (order.status === 'cancelled') continue
    if (!isPaidOrder(order)) continue

    const created = toDate(order.createdAt)
    if (!created) continue

    if (isOrderActive(order)) activeOrders += 1

    if (created >= weekStart) {
      revenueWeekCents += order.total
      ordersWeek += 1

      for (const item of order.items) {
        const prev = itemCounts.get(item.menuItemId)
        itemCounts.set(item.menuItemId, {
          name: item.name,
          quantity: (prev?.quantity ?? 0) + item.quantity,
        })
      }
    }

    if (created >= todayStart) {
      revenueTodayCents += order.total
      ordersToday += 1
    }
  }

  const bestsellers = [...itemCounts.entries()]
    .map(([menuItemId, { name, quantity }]) => ({ menuItemId, name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const avgOrderValueCents = ordersWeek > 0 ? Math.round(revenueWeekCents / ordersWeek) : 0

  return {
    revenueTodayCents,
    ordersToday,
    activeOrders,
    revenueWeekCents,
    ordersWeek,
    avgOrderValueCents,
    bestsellers,
  }
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatOrderTime(value: Timestamp | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'
  return date.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
