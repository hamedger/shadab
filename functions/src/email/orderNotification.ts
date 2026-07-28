import * as functions from 'firebase-functions/v2'
import fetch from 'node-fetch'
import { getLocationLabel } from '../constants/locations'

const DEFAULT_NOTIFICATION_EMAIL = 'mjalaluddin63@gmail.com'

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatOrderShortId(orderId: string): string {
  return orderId.slice(-6).toUpperCase()
}

export interface OrderNotificationInput {
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
  deliveryFee?: number
  deliveryDistanceMiles?: number
}

export function buildOrderNotificationSubject(input: OrderNotificationInput): string {
  const location = getLocationLabel(input.locationId)
  const shortId = formatOrderShortId(input.orderId)
  const fulfillment = input.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'
  return `[${location}] New Order #${shortId} — ${fulfillment} — ${formatCents(input.total)}`
}

export function buildOrderNotificationBody(input: OrderNotificationInput): string {
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
  if (input.deliveryFee) lines.push(`Delivery fee: ${formatCents(input.deliveryFee)}`)
  if (input.deliveryDistanceMiles != null) {
    lines.push(`Delivery distance: ${input.deliveryDistanceMiles.toFixed(1)} mi`)
  }
  if (input.notes?.trim()) lines.push(`Notes: ${input.notes.trim()}`)

  lines.push('', 'Items:')
  for (const item of input.items) {
    const note = item.instructions?.trim() ? ` (${item.instructions.trim()})` : ''
    lines.push(`- ${item.quantity}x ${item.name}${note} — ${formatCents(item.price * item.quantity)}`)
  }

  return lines.join('\n')
}

export interface ResendMailConfig {
  apiKey: string
  fromEmail: string
  toEmail: string
}

function resolveResendConfig(config?: ResendMailConfig): ResendMailConfig {
  if (config) return config
  return {
    apiKey: process.env.RESEND_API_KEY?.trim() ?? '',
    fromEmail: process.env.RESEND_FROM_EMAIL?.trim() || 'orders@shadab.com',
    toEmail: process.env.ORDERS_NOTIFICATION_EMAIL?.trim() || DEFAULT_NOTIFICATION_EMAIL,
  }
}

export async function sendOrderNotificationEmail(
  input: OrderNotificationInput,
  config?: ResendMailConfig,
): Promise<void> {
  const { apiKey, fromEmail, toEmail } = resolveResendConfig(config)

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const subject = buildOrderNotificationSubject(input)
  const body = buildOrderNotificationBody(input)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Shadab Orders <${fromEmail}>`,
      to: [toEmail],
      subject,
      text: body,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Resend failed (${response.status}): ${detail}`)
  }

  functions.logger.info('Order notification email sent', {
    orderId: input.orderId,
    to: toEmail,
    subject,
  })
}
