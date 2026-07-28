import { Order, OrderStatus } from '../../types/order'
import { formatCents } from './stats'

export type OrderAlertSnapshot = {
  status: OrderStatus
  hasPayment: boolean
}

export function orderHasRecordedPayment(order: Pick<Order, 'cloverPaymentId'>): boolean {
  return String(order.cloverPaymentId ?? '').trim().length > 0
}

export function snapshotOrderForAlerts(order: Order): OrderAlertSnapshot {
  return {
    status: order.status,
    hasPayment: orderHasRecordedPayment(order),
  }
}

/** True when a paid order just appeared or transitioned from pending/unpaid. */
export function shouldAlertForNewPaidOrder(
  previous: OrderAlertSnapshot | undefined,
  current: Order,
): boolean {
  if (!previous) return false

  const snapshot = snapshotOrderForAlerts(current)
  if (snapshot.status === 'pending' || snapshot.status === 'cancelled') return false

  const isPaidNow = snapshot.hasPayment || snapshot.status === 'placed'
  if (!isPaidNow) return false

  if (previous.status === 'pending') return true
  if (!previous.hasPayment && snapshot.hasPayment) return true

  return false
}

export function formatOrderAlertTitle(order: Order): string {
  const shortId = order.id.slice(-6).toUpperCase()
  const fulfillment = order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'
  return `New ${fulfillment} Order #${shortId}`
}

export function formatOrderAlertBody(order: Order, customerName?: string): string {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const customer = customerName?.trim()
  const parts = [formatCents(order.total), `${itemCount} item${itemCount === 1 ? '' : 's'}`]
  if (customer) parts.unshift(customer)
  return parts.join(' · ')
}

export function showBrowserOrderNotification(
  order: Order,
  customerName?: string,
): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'granted') return null

  return new Notification(formatOrderAlertTitle(order), {
    body: formatOrderAlertBody(order, customerName),
    tag: `order-${order.id}`,
    requireInteraction: true,
  })
}

export type BrowserNotificationPermission = NotificationPermission | 'unsupported'

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}
