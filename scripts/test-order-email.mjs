/**
 * Send a sample order notification email via Resend.
 *
 * Usage:
 *   npm run test:order-email
 *   npm run test:order-email -- promitsinc@gmail.com
 *   npm run test:order-email -- --location farmington-hills-mi
 *   npm run test:order-email -- --all-locations promitsinc@gmail.com
 *
 * Reads secrets from functions/.env:
 *   RESEND_API_KEY, RESEND_FROM_EMAIL, ORDERS_NOTIFICATION_EMAIL
 */
import { config } from 'dotenv'
import { randomBytes } from 'crypto'

config({ path: 'functions/.env' })
config({ path: 'functions/.secret.local', override: true })

const LOCATION_ID_ALIASES = {
  farmingtonhills: 'farmington-hills-mi',
}

const LOCATION_LABELS = {
  'chicago-il': 'Northville',
  'farmington-hills-mi': 'Farmington Hills',
}

const KNOWN_LOCATIONS = Object.keys(LOCATION_LABELS)

function parseArgs(argv) {
  let toEmail = process.env.TEST_ORDER_EMAIL || 'promitsinc@gmail.com'
  let locationId = 'chicago-il'
  let allLocations = false

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--location') {
      locationId = argv[i + 1] ?? locationId
      i += 1
      continue
    }
    if (arg === '--all-locations') {
      allLocations = true
      continue
    }
    if (arg.includes('@')) {
      toEmail = arg.trim()
    }
  }

  return { toEmail, locationId, allLocations }
}

function normalizeLocationId(locationId) {
  const trimmed = String(locationId ?? '').trim()
  if (!trimmed) return ''
  const key = trimmed.toLowerCase()
  return LOCATION_ID_ALIASES[key] ?? trimmed
}

function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

function getLocationLabel(locationId) {
  const normalized = normalizeLocationId(locationId)
  return LOCATION_LABELS[normalized] ?? normalized
}

function buildSampleOrder(locationId) {
  const orderId = `test-${normalizeLocationId(locationId).replace(/-/g, '')}-${randomBytes(3).toString('hex')}`
  return {
    orderId,
    locationId: normalizeLocationId(locationId),
    fulfillmentType: 'pickup',
    total: 4599,
    scheduledFor: '2026-06-24',
    pickupTime: '6:30 PM',
    notes: `Sample test order (${getLocationLabel(locationId)}) — please ignore`,
    customerEmail: 'promitsinc@gmail.com',
    customerPhone: '(248) 555-0100',
    items: [
      { name: 'Chicken Biryani', quantity: 2, price: 1499, instructions: 'Extra raita' },
      { name: 'Mix Veg Coco Curry', quantity: 1, price: 1299 },
      { name: 'Garlic Naan', quantity: 2, price: 399 },
    ],
  }
}

function buildSubject(order) {
  const location = getLocationLabel(order.locationId)
  const shortId = order.orderId.slice(-6).toUpperCase()
  const fulfillment = order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'
  return `[${location}] New Order #${shortId} — ${fulfillment} — ${formatCents(order.total)}`
}

function buildBody(order) {
  const location = getLocationLabel(order.locationId)
  const shortId = order.orderId.slice(-6).toUpperCase()
  const lines = [
    `New order at ${location}`,
    `Order ID: ${order.orderId} (#${shortId})`,
    `Fulfillment: ${order.fulfillmentType}`,
    `Total: ${formatCents(order.total)}`,
    `Scheduled: ${order.scheduledFor} ${order.pickupTime}`,
    `Customer email: ${order.customerEmail}`,
    `Customer phone: ${order.customerPhone}`,
    `Notes: ${order.notes}`,
    '',
    'Items:',
  ]

  for (const item of order.items) {
    const note = item.instructions ? ` (${item.instructions})` : ''
    lines.push(`- ${item.quantity}x ${item.name}${note} — ${formatCents(item.price * item.quantity)}`)
  }

  lines.push('', '— This is a test notification from scripts/test-order-email.mjs —')
  return lines.join('\n')
}

async function sendSampleEmail(order, { apiKey, fromEmail, toEmail }) {
  const subject = buildSubject(order)
  const text = buildBody(order)

  console.log(`Sending sample order email to ${toEmail}...`)
  console.log(`Location: ${getLocationLabel(order.locationId)} (${order.locationId})`)
  console.log(`From: ${fromEmail}`)
  console.log(`Subject: ${subject}`)

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
      text,
    }),
  })

  const payload = await response.text()
  if (!response.ok) {
    if (response.status === 401) {
      console.error('Resend rejected the API key (401).')
      console.error('Copy a fresh key from https://resend.com/api-keys into functions/.env as RESEND_API_KEY')
    } else if (response.status === 403 && fromEmail !== 'onboarding@resend.dev') {
      console.warn(`From address "${fromEmail}" may be unverified. Retrying with onboarding@resend.dev...`)
      const retry = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Shadab Orders <onboarding@resend.dev>',
          to: [toEmail],
          subject,
          text,
        }),
      })
      const retryPayload = await retry.text()
      if (retry.ok) {
        console.log('Email sent successfully (via onboarding@resend.dev).')
        console.log('Resend response:', JSON.parse(retryPayload))
        return
      }
      console.error(`Retry failed (${retry.status}):`, retryPayload)
      process.exit(1)
    }
    console.error(`Resend failed (${response.status}):`, payload)
    process.exit(1)
  }

  let result
  try {
    result = JSON.parse(payload)
  } catch {
    result = payload
  }

  console.log('Email sent successfully.')
  console.log('Resend response:', result)
}

async function main() {
  const { toEmail, locationId, allLocations } = parseArgs(process.argv)
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev'

  if (!apiKey) {
    console.error('Missing RESEND_API_KEY in functions/.env')
    process.exit(1)
  }

  if (apiKey.includes('YOUR_') || apiKey.length < 30) {
    console.error('RESEND_API_KEY looks like a placeholder or is incomplete.')
    console.error('1. Create a key at https://resend.com/api-keys')
    console.error('2. Paste the full key into functions/.env')
    console.error('3. Save the file, then run: npm run test:order-email -- promitsinc@gmail.com')
    process.exit(1)
  }

  const normalized = normalizeLocationId(locationId)
  if (!allLocations && !KNOWN_LOCATIONS.includes(normalized)) {
    console.error(`Unknown location "${locationId}". Use one of: ${KNOWN_LOCATIONS.join(', ')}`)
    process.exit(1)
  }

  const targets = allLocations ? KNOWN_LOCATIONS : [normalized]
  for (const targetLocationId of targets) {
    const order = buildSampleOrder(targetLocationId)
    await sendSampleEmail(order, { apiKey, fromEmail, toEmail })
    if (targets.length > 1) console.log('')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
