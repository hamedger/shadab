import { ResendMailConfig } from './resendConfig'

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatOrderShortId(orderId: string): string {
  return orderId.slice(-6).toUpperCase()
}

export interface CustomerDeliveredEmailInput {
  orderId: string
  toEmail: string
  total: number
  items: Array<{ name: string; quantity: number; price: number }>
}

export function buildCustomerDeliveredEmailSubject(input: CustomerDeliveredEmailInput): string {
  return `Your Shadab order #${formatOrderShortId(input.orderId)} has been delivered!`
}

export function buildCustomerDeliveredEmailBody(input: CustomerDeliveredEmailInput): string {
  const lines = [
    'Your order has been delivered — we hope you enjoy it!',
    '',
    `Order #${formatOrderShortId(input.orderId)}`,
    '',
    'Items:',
  ]

  for (const item of input.items) {
    lines.push(`- ${item.quantity}x ${item.name} — ${formatCents(item.price * item.quantity)}`)
  }

  lines.push('', `Total: ${formatCents(input.total)}`, '', 'Thank you for choosing Shadab!')

  return lines.join('\n')
}

export async function sendCustomerDeliveredEmail(
  input: CustomerDeliveredEmailInput,
  config: ResendMailConfig,
): Promise<void> {
  const { apiKey, fromEmail } = config

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const subject = buildCustomerDeliveredEmailSubject(input)
  const body = buildCustomerDeliveredEmailBody(input)

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
