import { ResendMailConfig } from './resendConfig'

/** Keep in sync with constants/config.ts (web) — restaurant contact details for customer emails. */
const RESTAURANT_NAME = 'Shadab Restaurant & Grill'
const RESTAURANT_ADDRESS = '2311 W Devon Ave, Chicago, IL 60659'
const RESTAURANT_PHONE_DISPLAY = '(877) 742-3222'
const RESTAURANT_WEBSITE = 'https://shadab.io'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast Buffet',
  lunch: 'Lunch Buffet',
  dinner: 'Dinner Buffet',
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatReservationShortId(reservationId: string): string {
  return reservationId.slice(-6).toUpperCase()
}

/** "2026-10-16" → "Friday, October 16, 2026" */
function formatDateLong(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number)
  if (!y || !m || !d) return dateString
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export interface CustomerReservationConfirmationInput {
  reservationId: string
  toEmail: string
  name: string
  meal?: string
  date: string
  time: string
  partySize: number
  adults?: number
  children?: number
  infants?: number
  subtotalCents?: number
  taxCents?: number
  feeCents: number
  occasion?: string
  specialRequests?: string
}

export function buildCustomerReservationConfirmationSubject(
  input: CustomerReservationConfirmationInput,
): string {
  return `Your table at Shadab is reserved — ${formatDateLong(input.date)} at ${input.time}`
}

export function buildCustomerReservationConfirmationBody(input: CustomerReservationConfirmationInput): string {
  const mealLabel = MEAL_LABELS[input.meal ?? ''] ?? 'Buffet'
  const firstName = input.name.trim().split(/\s+/)[0] || 'there'

  const guests =
    input.adults != null
      ? [
          plural(input.adults, 'adult', 'adults'),
          input.children ? plural(input.children, 'child (5–10)', 'children (5–10)') : '',
          input.infants ? plural(input.infants, 'child under 5', 'children under 5') : '',
        ]
          .filter(Boolean)
          .join(', ')
      : plural(input.partySize, 'guest', 'guests')

  const lines = [
    `Hi ${firstName},`,
    '',
    'Your table reservation is confirmed and your buffet is paid. We look forward to serving you!',
    '',
    '==============================',
    `  RESERVATION #${formatReservationShortId(input.reservationId)}`,
    '==============================',
    'Show this email at the host stand when you arrive,',
    'or just give us your name and phone number.',
    '',
    `${mealLabel}`,
    `Date: ${formatDateLong(input.date)}`,
    `Seating time: ${input.time}${
      input.meal === 'dinner' && /AM$/i.test(input.time.trim()) ? ' (after midnight, the night of the date above)' : ''
    }`,
    `Party: ${guests}`,
  ]
  if (input.occasion?.trim()) lines.push(`Occasion: ${input.occasion.trim()}`)
  if (input.specialRequests?.trim()) lines.push(`Special requests: ${input.specialRequests.trim()}`)

  lines.push('')
  if (input.subtotalCents != null && input.taxCents != null) {
    lines.push(`Buffet: ${formatCents(input.subtotalCents)}`, `Tax: ${formatCents(input.taxCents)}`)
  }
  lines.push(`Total paid: ${formatCents(input.feeCents)}`)

  lines.push(
    '',
    'Cancellation policy',
    '- Free cancellation up to 48 hours before your reservation.',
    '- Cancellations within 48 hours are charged a 20% fee; the rest is refunded.',
    `- To cancel, please call us at ${RESTAURANT_PHONE_DISPLAY}.`,
    '',
    RESTAURANT_NAME,
    RESTAURANT_ADDRESS,
    RESTAURANT_PHONE_DISPLAY,
    RESTAURANT_WEBSITE,
    '',
    'Thank you for choosing Shadab!',
  )

  return lines.join('\n')
}

export async function sendCustomerReservationConfirmationEmail(
  input: CustomerReservationConfirmationInput,
  config: ResendMailConfig,
): Promise<void> {
  const { apiKey, fromEmail } = config

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Shadab <${fromEmail}>`,
      to: [input.toEmail],
      subject: buildCustomerReservationConfirmationSubject(input),
      text: buildCustomerReservationConfirmationBody(input),
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Resend failed (${response.status}): ${detail}`)
  }
}
