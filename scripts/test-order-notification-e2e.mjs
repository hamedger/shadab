/**
 * E2E: Clover checkout -> confirm (success-page fallback) -> staff email trigger.
 * Verifies the notification payload matches the paid Firestore order document.
 *
 * Usage:
 *   node scripts/test-order-notification-e2e.mjs
 *   node scripts/test-order-notification-e2e.mjs --scenario biryani-feast
 *   node scripts/test-order-notification-e2e.mjs --location farmington-hills-mi
 *   node scripts/test-order-notification-e2e.mjs --all-locations
 */
import { config as loadEnv } from 'dotenv'
import { assertEmailMatchesPaidOrder } from './lib/orderNotificationFormat.mjs'

loadEnv({ path: '.env' })
loadEnv({ path: 'functions/.env', override: true })

const KNOWN_LOCATIONS = ['chicago-il', 'farmington-hills-mi']

const ORDER_SCENARIOS = [
  {
    id: 'naan-pair',
    label: 'Butter Naan + Garlic Naan x2',
    items: [
      { menuItemId: 'butter-naan', name: 'Butter Naan', price: 399, quantity: 1 },
      {
        menuItemId: 'garlic-naan',
        name: 'Garlic Naan',
        price: 399,
        quantity: 2,
        instructions: 'Extra crispy',
      },
    ],
  },
  {
    id: 'biryani-feast',
    label: 'Chicken Biryani + Butter Naan x2 + Raita',
    items: [
      { menuItemId: 'chicken-biryani', name: 'Chicken Biryani', price: 1499, quantity: 1 },
      { menuItemId: 'butter-naan', name: 'Butter Naan', price: 399, quantity: 2 },
      { menuItemId: 'raita', name: 'Raita', price: 299, quantity: 1 },
    ],
  },
  {
    id: 'mixed-cart',
    label: 'French Fries + Mix Veg Curry + Garlic Naan',
    items: [
      { menuItemId: 'french-fries', name: 'French Fries', price: 499, quantity: 1 },
      { menuItemId: 'mix-veg-coco-curry', name: 'Mix Veg Coco Curry', price: 1299, quantity: 1 },
      {
        menuItemId: 'garlic-naan',
        name: 'Garlic Naan',
        price: 399,
        quantity: 1,
        instructions: 'Well done',
      },
    ],
  },
]

function parseArgs() {
  let locations = ['chicago-il']
  let scenarios = ORDER_SCENARIOS

  if (process.argv.includes('--all-locations')) {
    locations = KNOWN_LOCATIONS
  } else {
    const idx = process.argv.indexOf('--location')
    if (idx >= 0 && process.argv[idx + 1]) {
      locations = [process.argv[idx + 1].trim()]
    }
  }

  const scenarioIdx = process.argv.indexOf('--scenario')
  if (scenarioIdx >= 0 && process.argv[scenarioIdx + 1]) {
    const id = process.argv[scenarioIdx + 1].trim()
    const match = ORDER_SCENARIOS.find((s) => s.id === id)
    if (!match) {
      throw new Error(
        `Unknown scenario "${id}". Use one of: ${ORDER_SCENARIOS.map((s) => s.id).join(', ')}`,
      )
    }
    scenarios = [match]
  }

  return { locations, scenarios }
}

const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '')
const authReferer = process.env.E2E_AUTH_REFERER || 'https://shadab.com/'
const functionsRegion = 'us-central1'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * 0.06)
  const serviceFee = Math.round(subtotal * 0.03)
  const total = subtotal + tax + serviceFee
  return { subtotal, tax, serviceFee, total }
}

async function firebaseAuth(path, body) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: authReferer,
      },
      body: JSON.stringify(body),
    },
  )
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Firebase auth failed (${response.status})`)
  }
  return payload
}

async function callConfirmCloverOrder(idToken, orderId, checkoutSessionId) {
  const response = await fetch(
    `https://${functionsRegion}-${projectId}.cloudfunctions.net/confirmCloverOrder`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ data: { orderId, checkoutSessionId } }),
    },
  )
  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.error?.message ?? JSON.stringify(payload))
  }
  return payload.result
}

function fieldValue(fields, key) {
  const f = fields[key]
  if (!f) return null
  return parseFirestoreValue(f)
}

function parseFirestoreValue(f) {
  if (f.stringValue !== undefined) return f.stringValue
  if (f.integerValue !== undefined) return Number(f.integerValue)
  if (f.doubleValue !== undefined) return Number(f.doubleValue)
  if (f.booleanValue !== undefined) return f.booleanValue
  if (f.nullValue !== undefined) return null
  if (f.arrayValue) {
    return (f.arrayValue.values ?? []).map(parseFirestoreValue)
  }
  if (f.mapValue) {
    const obj = {}
    for (const [key, value] of Object.entries(f.mapValue.fields ?? {})) {
      obj[key] = parseFirestoreValue(value)
    }
    return obj
  }
  return null
}

async function getOrder(idToken, orderId) {
  const dbId = encodeURIComponent(process.env.EXPO_PUBLIC_FIRESTORE_DATABASE_ID || '(default)')
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/orders/${orderId}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  })
  if (!response.ok) return null
  const doc = await response.json()
  const fields = doc.fields ?? {}
  return {
    status: fieldValue(fields, 'status'),
    staffNotified: fieldValue(fields, 'staffNotified'),
    cloverPaymentId: fieldValue(fields, 'cloverPaymentId'),
    cloverCheckoutSessionId: fieldValue(fields, 'cloverCheckoutSessionId'),
    locationId: fieldValue(fields, 'locationId'),
    fulfillmentType: fieldValue(fields, 'fulfillmentType'),
    total: fieldValue(fields, 'total'),
    notes: fieldValue(fields, 'notes'),
    guestEmail: fieldValue(fields, 'guestEmail'),
    guestPhone: fieldValue(fields, 'guestPhone'),
    scheduledFor: fieldValue(fields, 'scheduledFor'),
    pickupTime: fieldValue(fields, 'pickupTime'),
    items: fieldValue(fields, 'items') ?? [],
  }
}

async function runScenario(locationId, scenario, runId) {
  const tag = `[${locationId}/${scenario.id}]`
  const email = `e2e.${scenario.id}.${runId}@mailinator.com`
  const password = `Notify${String(runId).replace(/\D/g, '').slice(-10)}!Aa1`
  let authPayload
  try {
    authPayload = await firebaseAuth('accounts:signUp', {
      email,
      password,
      returnSecureToken: true,
    })
  } catch (error) {
    throw new Error(`${tag} signUp failed for ${email}: ${error.message}`)
  }

  const { subtotal, tax, serviceFee, total } = calculateTotals(scenario.items)
  const notes = `Email notification e2e ${scenario.id} ${locationId} ${runId}`

  console.log(`\n${tag} Scenario: ${scenario.label}`)
  console.log(`${tag} Items: ${scenario.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}`)
  console.log(`${tag} Expected total: $${(total / 100).toFixed(2)} (subtotal $${(subtotal / 100).toFixed(2)})`)

  const checkoutResp = await fetch(`${apiUrl}/api/clover/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authPayload.idToken}`,
    },
    body: JSON.stringify({
      items: scenario.items,
      subtotal,
      tax,
      serviceFee,
      deliveryFee: 0,
      tip: 0,
      promoCode: '',
      promoDiscount: 0,
      loyaltyPointsUsed: 0,
      giftCardAmount: 0,
      total,
      fulfillmentType: 'pickup',
      deliveryAddress: null,
      locationId,
      notes,
      customerName: 'E2E Notify Test',
      customerPhone: '2485550100',
      customerEmail: email,
      pickupDate: new Date().toISOString().slice(0, 10),
      pickupTime: 'asap',
    }),
  })

  const checkout = await checkoutResp.json()
  if (!checkoutResp.ok) {
    throw new Error(
      checkout.error ?? `Checkout failed (${checkoutResp.status}) for ${tag}: ${JSON.stringify(checkout)}`,
    )
  }

  console.log(`${tag} Created pending order:`, checkout.orderId)
  console.log(`${tag} Expected admin short id: #${checkout.orderId.slice(-6).toUpperCase()}`)

  console.log(`${tag} Confirming order (simulates checkout success page)...`)
  const confirmResult = await callConfirmCloverOrder(
    authPayload.idToken,
    checkout.orderId,
    checkout.checkoutSessionId,
  )
  console.log(`${tag} confirmCloverOrder:`, confirmResult)

  console.log(`${tag} Waiting for notifyStaffOnOrder email trigger...`)
  for (let attempt = 1; attempt <= 12; attempt++) {
    await sleep(2500)
    const order = await getOrder(authPayload.idToken, checkout.orderId)
    console.log(
      `${tag} poll ${attempt}: status=${order?.status}, staffNotified=${order?.staffNotified ?? 'null'}, itemCount=${order?.items?.length ?? 0}`,
    )
    if (order?.staffNotified === true) {
      if (order.status !== 'placed') {
        throw new Error(`${tag} status=${order.status}, expected placed after payment`)
      }
      if (!order.cloverPaymentId) {
        throw new Error(`${tag} missing cloverPaymentId after payment`)
      }
      if (order.locationId !== locationId) {
        throw new Error(`${tag} locationId=${order.locationId}, expected ${locationId}`)
      }
      if (order.items.length !== scenario.items.length) {
        throw new Error(
          `${tag} saved ${order.items.length} items, expected ${scenario.items.length}`,
        )
      }

      const orderForEmail = {
        ...order,
        guestEmail: order.guestEmail || email,
        guestPhone: order.guestPhone || '2485550100',
      }
      if (!order.guestEmail) {
        console.log(`${tag} guestEmail empty on order doc — using user profile email (${email})`)
      }

      const { subject, body } = assertEmailMatchesPaidOrder(checkout.orderId, orderForEmail, {
        locationId,
        total,
        notes,
        customerEmail: email,
      })

      console.log(`\nSUCCESS ${tag}: Paid multi-item order matches email notification payload.`)
      console.log(`${tag} Order: ${checkout.orderId} (#${checkout.orderId.slice(-6).toUpperCase()})`)
      console.log(`${tag} Subject: ${subject}`)
      console.log(`${tag} Email body preview:\n${body}`)
      return { orderId: checkout.orderId, scenario: scenario.id, subject }
    }
  }

  throw new Error(`${tag} staffNotified was not set — check firebase functions:log --only notifyStaffOnOrder`)
}

async function main() {
  if (!projectId || !apiKey || !apiUrl) {
    throw new Error('Missing EXPO_PUBLIC_FIREBASE_PROJECT_ID, API key, or API URL')
  }

  const { locations, scenarios } = parseArgs()
  const runId = Date.now()
  const results = []

  console.log(
    `Running ${scenarios.length} scenario(s) across ${locations.length} location(s): ${scenarios.map((s) => s.id).join(', ')}`,
  )

  for (const locationId of locations) {
    for (let i = 0; i < scenarios.length; i += 1) {
      const scenario = scenarios[i]
      const scenarioRunId = `${runId}${i}`
      const result = await runScenario(locationId, scenario, scenarioRunId)
      results.push(result)
    }
  }

  console.log('\n=== All scenarios passed ===')
  for (const result of results) {
    console.log(`- ${result.scenario}: ${result.orderId} — ${result.subject}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
