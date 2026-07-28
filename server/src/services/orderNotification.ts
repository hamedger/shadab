import type { Firestore } from 'firebase-admin/firestore'
import { hasOrderPayment } from '../lib/orderPayment'

const LOCATION_LABELS: Record<string, string> = {
  'chicago-il': 'Chicago',
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatOrderShortId(orderId: string): string {
  return orderId.slice(-6).toUpperCase()
}

function getLocationLabel(locationId: string): string {
  return LOCATION_LABELS[locationId] ?? locationId
}

export interface StaffOrderNotificationInput {
  orderId: string
  locationId: string
  fulfillmentType: string
  total: number
  items: Array<{ name: string; quantity: number; price: number; instructions?: string }>
  pickupTime?: string | null
  scheduledFor?: string | null
  notes?: string
  customerEmail?: string
  customerPhone?: string
}

function buildSubject(input: StaffOrderNotificationInput): string {
  const location = getLocationLabel(input.locationId)
  const shortId = formatOrderShortId(input.orderId)
  const fulfillment = input.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'
  return `[${location}] New Order #${shortId} — ${fulfillment} — ${formatCents(input.total)}`
}

function buildBody(input: StaffOrderNotificationInput): string {
  const location = getLocationLabel(input.locationId)
  const shortId = formatOrderShortId(input.orderId)
  const lines = [
    `New order at ${location}`,
    `Order ID: ${input.orderId} (#${shortId})`,
    `Fulfillment: ${input.fulfillmentType}`,
    `Total: ${formatCents(input.total)}`,
  ]

  if (input.scheduledFor || input.pickupTime) {
    const schedule = [input.scheduledFor, input.pickupTime].filter(Boolean).join(' ')
    lines.push(`Scheduled: ${schedule}`)
  }
  if (input.customerEmail) lines.push(`Customer email: ${input.customerEmail}`)
  if (input.customerPhone) lines.push(`Customer phone: ${input.customerPhone}`)
  if (input.notes?.trim()) lines.push(`Notes: ${input.notes.trim()}`)

  lines.push('', 'Items:')
  for (const item of input.items) {
    const note = item.instructions?.trim() ? ` (${item.instructions.trim()})` : ''
    lines.push(`- ${item.quantity}x ${item.name}${note} — ${formatCents(item.price * item.quantity)}`)
  }

  return lines.join('\n')
}

/** Claim staffNotified in Firestore so webhook + Cloud Function do not double-send. */
export async function trySendStaffOrderNotification(
  db: Firestore,
  orderId: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    console.warn('[orderNotification] RESEND_API_KEY not set — skipping staff email')
    return false
  }

  const orderRef = db.collection('orders').doc(orderId)
  const claimed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef)
    if (!snap.exists) return null
    const order = snap.data()!
    if (order.staffNotified === true || !hasOrderPayment(order)) return null
    if (order.status === 'cancelled') return null
    tx.update(orderRef, {
      staffNotified: true,
      updatedAt: new Date(),
    })
    return order
  })

  if (!claimed) return false

  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'orders@shadab.com'
  const toEmail = process.env.ORDERS_NOTIFICATION_EMAIL?.trim() || 'mjalaluddin63@gmail.com'

  let customerEmail = String(claimed.guestEmail ?? '').trim()
  let customerPhone = String(claimed.guestPhone ?? '').trim()
  const userId = String(claimed.userId ?? '')
  if (userId && userId !== 'guest' && (!customerEmail || !customerPhone)) {
    try {
      const userSnap = await db.collection('users').doc(userId).get()
      if (userSnap.exists) {
        const user = userSnap.data()!
        if (!customerEmail) customerEmail = String(user.email ?? '').trim()
        if (!customerPhone) customerPhone = String(user.phone ?? '').trim()
      }
    } catch {
      // profile lookup is best-effort
    }
  }

  const input: StaffOrderNotificationInput = {
    orderId,
    locationId: String(claimed.locationId ?? ''),
    fulfillmentType: String(claimed.fulfillmentType ?? 'pickup'),
    total: Number(claimed.total ?? 0),
    items: Array.isArray(claimed.items) ? claimed.items : [],
    pickupTime: claimed.pickupTime ? String(claimed.pickupTime) : null,
    scheduledFor: claimed.scheduledFor ? String(claimed.scheduledFor) : null,
    notes: String(claimed.notes ?? ''),
    customerEmail: customerEmail || undefined,
    customerPhone: customerPhone || undefined,
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Shadab Orders <${fromEmail}>`,
        to: [toEmail],
        subject: buildSubject(input),
        text: buildBody(input),
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Resend failed (${response.status}): ${detail}`)
    }

    console.info('[orderNotification] Staff email sent', { orderId, to: toEmail })
    return true
  } catch (error) {
    await orderRef.update({
      staffNotified: false,
      updatedAt: new Date(),
    })
    console.error('[orderNotification] Failed to send staff email', {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}
