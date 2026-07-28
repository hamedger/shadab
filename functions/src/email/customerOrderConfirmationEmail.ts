import { ResendMailConfig } from './resendConfig'
import { getLocationLabel } from '../constants/locations'

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatOrderShortId(orderId: string): string {
  return orderId.slice(-6).toUpperCase()
}

function formatAddress(addr: {
  street: string
  city: string
  state: string
  zip: string
  unit?: string
}): string {
  const street = addr.unit?.trim() ? `${addr.street}, ${addr.unit}` : addr.street
  return `${street}, ${addr.city}, ${addr.state} ${addr.zip}`
}

export interface CustomerOrderConfirmationInput {
  orderId: string
  toEmail: string
  locationId: string
  fulfillmentType: string
  total: number
  items: Array<{ name: string; quantity: number; price: number; instructions?: string }>
  deliveryAddress?: {
    street: string
    city: string
    state: string
    zip: string
    unit?: string
  } | null
  scheduledFor?: string | null
  pickupTime?: string | null
}

export function buildCustomerOrderConfirmationSubject(input: CustomerOrderConfirmationInput): string {
  return `Your Shadab order #${formatOrderShortId(input.orderId)} is confirmed!`
}

export function buildCustomerOrderConfirmationBody(input: CustomerOrderConfirmationInput): string {
  const isDelivery = input.fulfillmentType === 'delivery'
  const locationLabel = getLocationLabel(input.locationId)

  const lines = [
    "Thanks for your order! We've received it and the kitchen is getting started.",
    '',
    `Order #${formatOrderShortId(input.orderId)}`,
    `Location: Shadab — ${locationLabel}`,
    '',
    'Items:',
  ]

  for (const item of input.items) {
    const note = item.instructions?.trim() ? ` (${item.instructions.trim()})` : ''
    lines.push(`- ${item.quantity}x ${item.name}${note} — ${formatCents(item.price * item.quantity)}`)
  }

  lines.push('', `Total: ${formatCents(input.total)}`, '')

  if (isDelivery && input.deliveryAddress) {
    lines.push(`Delivering to: ${formatAddress(input.deliveryAddress)}`)
  } else if (input.scheduledFor || input.pickupTime) {
    const schedule = [input.scheduledFor, input.pickupTime].filter(Boolean).join(' ')
    lines.push(`Pickup: ${schedule}`)
  }

  lines.push('', 'Questions about your order? Just reply to this email or contact the restaurant.', '', 'Thank you for choosing Shadab!')

  return lines.join('\n')
}

export async function sendCustomerOrderConfirmationEmail(
  input: CustomerOrderConfirmationInput,
  config: ResendMailConfig,
): Promise<void> {
  const { apiKey, fromEmail } = config

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const subject = buildCustomerOrderConfirmationSubject(input)
  const body = buildCustomerOrderConfirmationBody(input)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Shadab <${fromEmail}>`,
      to: [input.toEmail],
      subject,
      text: body,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Resend failed (${response.status}): ${detail}`)
  }
}
