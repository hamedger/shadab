import * as admin from 'firebase-admin'
import { resolveOrderLocationId } from '../constants/locations'
import type { OrderNotificationInput } from './orderNotification'

function formatScheduleValue(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate
    if (typeof toDate === 'function') {
      return toDate.call(value).toISOString().slice(0, 10)
    }
  }
  return String(value)
}

/** Build staff email payload from the current Firestore order document. */
export function orderNotificationInputFromDoc(
  orderId: string,
  order: Record<string, unknown>,
): OrderNotificationInput {
  let customerEmail = String(order.guestEmail ?? '').trim()
  let customerPhone = String(order.guestPhone ?? '').trim()

  return {
    orderId,
    locationId: resolveOrderLocationId(order),
    fulfillmentType: String(order.fulfillmentType ?? 'pickup'),
    total: Number(order.total ?? 0),
    items: Array.isArray(order.items) ? order.items : [],
    pickupTime: formatScheduleValue(order.pickupTime),
    scheduledFor: formatScheduleValue(order.scheduledFor),
    notes: String(order.notes ?? ''),
    customerEmail: customerEmail || undefined,
    customerPhone: customerPhone || undefined,
    deliveryFee: Number(order.deliveryFee ?? 0) || undefined,
    deliveryDistanceMiles:
      typeof order.deliveryDistanceMiles === 'number' ? order.deliveryDistanceMiles : undefined,
  }
}

export async function enrichCustomerContactFromUser(
  db: admin.firestore.Firestore,
  order: Record<string, unknown>,
  input: OrderNotificationInput,
): Promise<OrderNotificationInput> {
  const userId = String(order.userId ?? '')
  if (!userId || userId === 'guest') return input

  let customerEmail = input.customerEmail ?? ''
  let customerPhone = input.customerPhone ?? ''
  if (customerEmail && customerPhone) return input

  try {
    const userSnap = await db.collection('users').doc(userId).get()
    if (!userSnap.exists) return input
    const user = userSnap.data()!
    if (!customerEmail) customerEmail = String(user.email ?? '').trim()
    if (!customerPhone) customerPhone = String(user.phone ?? '').trim()
  } catch {
    // profile lookup is best-effort
  }

  return {
    ...input,
    customerEmail: customerEmail || undefined,
    customerPhone: customerPhone || undefined,
  }
}
