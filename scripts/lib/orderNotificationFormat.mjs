/** Mirrors functions/src/email/orderNotification.ts + orderNotificationInput.ts for scripts/tests. */

const LOCATION_ID_ALIASES = {
  farmingtonhills: 'farmington-hills-mi',
}

const LOCATION_LABELS = {
  'chicago-il': 'Northville',
  'farmington-hills-mi': 'Farmington Hills',
}

const DEFAULT_LOCATION_ID = 'chicago-il'

export function normalizeLocationId(locationId) {
  const trimmed = String(locationId ?? '').trim()
  if (!trimmed) return ''
  const key = trimmed.toLowerCase()
  return LOCATION_ID_ALIASES[key] ?? trimmed
}

export function getLocationLabel(locationId) {
  const normalized = normalizeLocationId(locationId)
  return LOCATION_LABELS[normalized] ?? normalized
}

export function resolveOrderLocationId(order) {
  const raw = String(order.locationId ?? '').trim()
  const normalized = normalizeLocationId(raw)
  if (normalized && LOCATION_LABELS[normalized]) {
    return normalized
  }
  return normalized || DEFAULT_LOCATION_ID
}

function formatScheduleValue(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'object' && value !== null && typeof value.toDate === 'function') {
    return value.toDate().toISOString().slice(0, 10)
  }
  return String(value)
}

export function orderNotificationInputFromDoc(orderId, order) {
  return {
    orderId,
    locationId: resolveOrderLocationId(order),
    fulfillmentType: String(order.fulfillmentType ?? 'pickup'),
    total: Number(order.total ?? 0),
    items: Array.isArray(order.items) ? order.items : [],
    pickupTime: formatScheduleValue(order.pickupTime),
    scheduledFor: formatScheduleValue(order.scheduledFor),
    notes: String(order.notes ?? ''),
    customerEmail: String(order.guestEmail ?? '').trim() || undefined,
    customerPhone: String(order.guestPhone ?? '').trim() || undefined,
  }
}

function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatOrderShortId(orderId) {
  return orderId.slice(-6).toUpperCase()
}

export function buildOrderNotificationSubject(input) {
  const location = getLocationLabel(input.locationId)
  const shortId = formatOrderShortId(input.orderId)
  const fulfillment = input.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'
  return `[${location}] New Order #${shortId} — ${fulfillment} — ${formatCents(input.total)}`
}

export function buildOrderNotificationBody(input) {
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

/** Assert email payload matches the paid Firestore order document. */
export function assertEmailMatchesPaidOrder(orderId, order, expected = {}) {
  const input = orderNotificationInputFromDoc(orderId, order)
  const subject = buildOrderNotificationSubject(input)
  const body = buildOrderNotificationBody(input)
  const shortId = formatOrderShortId(orderId)

  if (expected.locationId && input.locationId !== expected.locationId) {
    throw new Error(`locationId mismatch: email=${input.locationId}, expected=${expected.locationId}`)
  }
  if (expected.total != null && input.total !== expected.total) {
    throw new Error(`total mismatch: email=${input.total}, expected=${expected.total}`)
  }
  if (expected.itemName) {
    const names = input.items.map((item) => item.name)
    if (!names.includes(expected.itemName)) {
      throw new Error(`item name mismatch: email items=${names.join(', ')}, expected=${expected.itemName}`)
    }
  }
  if (expected.notes && !body.includes(expected.notes)) {
    throw new Error(`notes missing from email body: expected substring "${expected.notes}"`)
  }
  if (expected.customerEmail && input.customerEmail !== expected.customerEmail) {
    throw new Error(`customer email mismatch: email=${input.customerEmail}, expected=${expected.customerEmail}`)
  }
  if (!subject.includes(`#${shortId}`)) {
    throw new Error(`subject missing order short id #${shortId}: ${subject}`)
  }
  if (!body.includes(orderId)) {
    throw new Error(`body missing full order id ${orderId}`)
  }
  for (const item of input.items) {
    const line = `${item.quantity}x ${item.name}`
    if (!body.includes(line)) {
      throw new Error(`body missing item line "${line}"`)
    }
    const lineTotal = formatCents(item.price * item.quantity)
    if (!body.includes(lineTotal)) {
      throw new Error(`body missing item total ${lineTotal} for ${item.name}`)
    }
  }

  return { input, subject, body }
}
