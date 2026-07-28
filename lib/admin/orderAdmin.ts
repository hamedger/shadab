import { getFunctions, httpsCallable } from 'firebase/functions'
import { FirebaseError } from 'firebase/app'
import app, { isFirebaseConfigured } from '../firebase'
import { FulfillmentType, Order, OrderStatus } from '../../types/order'

export type OrderCustomerProfile = {
  displayName: string
  phone: string
}

export function resolveOrderCustomerInfo(
  order: Pick<Order, 'guestName' | 'guestPhone' | 'userId'>,
  profiles: Map<string, OrderCustomerProfile>,
): { name: string; phone: string } {
  const profile =
    order.userId && order.userId !== 'guest' ? profiles.get(order.userId) : undefined
  const name = String(order.guestName ?? '').trim() || profile?.displayName || ''
  const phone = String(order.guestPhone ?? '').trim() || profile?.phone || ''
  return { name, phone }
}

export function isPaidOrder(order: {
  status: OrderStatus
  cloverPaymentId?: string
}): boolean {
  if (order.status === 'placed') return true
  if (String(order.cloverPaymentId ?? '').trim()) return true
  return order.status !== 'pending' && order.status !== 'cancelled'
}

/** Every status a pickup or delivery order can pass through, used for filter tabs/labels. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
]

/** Pickup ends at 'picked_up' — the customer already has the food, there's no separate delivery event. */
const PICKUP_STATUS_FLOW: OrderStatus[] = ['pending', 'placed', 'confirmed', 'preparing', 'ready', 'picked_up']
const DELIVERY_STATUS_FLOW: OrderStatus[] = ORDER_STATUS_FLOW

/** True once an order has reached its final fulfillment state for its type (not cancelled). */
export function isOrderFulfilled(order: { status: OrderStatus; fulfillmentType: FulfillmentType }): boolean {
  if (order.status === 'delivered') return true
  return order.fulfillmentType === 'pickup' && order.status === 'picked_up'
}

/** Order is still in progress: not cancelled, and not yet fulfilled for its type. */
export function isOrderActive(order: { status: OrderStatus; fulfillmentType: FulfillmentType }): boolean {
  return order.status !== 'cancelled' && !isOrderFulfilled(order)
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export async function updateAdminOrderStatus(orderId: string, status: OrderStatus) {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured')

  const functions = getFunctions(app, 'us-central1')
  const updateOrderStatus = httpsCallable(functions, 'updateOrderStatus')
  await updateOrderStatus({
    orderId,
    status,
  })
}

export function nextOrderStatus(current: OrderStatus, fulfillmentType: FulfillmentType): OrderStatus | null {
  const flow = fulfillmentType === 'pickup' ? PICKUP_STATUS_FLOW : DELIVERY_STATUS_FLOW
  const idx = flow.indexOf(current)
  if (idx < 0 || idx >= flow.length - 1) return null
  return flow[idx + 1]
}

export function getCallableErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError && error.message) {
    return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}
