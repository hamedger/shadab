/** Quick webhook diagnostic — bad sig vs each location signing secret */
import { config as loadEnv } from 'dotenv'
import { createHmac } from 'crypto'

loadEnv({ path: '.env' })
loadEnv({ path: '.env.clover.local', override: true })
loadEnv({ path: 'server/.env', override: true })

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
const apiUrl = process.env.EXPO_PUBLIC_API_URL
const referer = process.env.E2E_AUTH_REFERER || 'https://shadab.com/'
const checkoutLocationId = process.argv.includes('--location')
  ? process.argv[process.argv.indexOf('--location') + 1]
  : 'chicago-il'

function signBody(body, webhookSecret) {
  const ts = Math.floor(Date.now() / 1000)
  const v1 = createHmac('sha256', webhookSecret).update(`${ts}.${body}`, 'utf8').digest('hex')
  return { ts, signature: `t=${ts},v1=${v1}` }
}

async function auth() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: referer },
    body: JSON.stringify({
      email: `wh${Date.now()}@t.com`,
      password: 'Test123!Aa',
      returnSecureToken: true,
    }),
  })
  return r.json()
}

function fv(fields, key) {
  const f = fields[key]
  return f?.stringValue ?? f?.booleanValue ?? null
}

async function getOrder(token, orderId) {
  const dbId = encodeURIComponent('(default)')
  const r = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/orders/${orderId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const doc = await r.json()
  const fields = doc.fields ?? {}
  return {
    status: fv(fields, 'status'),
    locationId: fv(fields, 'locationId'),
    merchantId: fv(fields, 'cloverMerchantId'),
    sessionId: fv(fields, 'cloverCheckoutSessionId'),
    staffNotified: fv(fields, 'staffNotified'),
    paymentId: fv(fields, 'cloverPaymentId'),
  }
}

async function postWebhook(body, signature) {
  return fetch(`${apiUrl}/api/clover/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Clover-Signature': signature },
    body,
  })
}

const authPayload = await auth()
const subtotal = 499
const tax = 30
const serviceFee = 15
const total = 544
const checkout = await fetch(`${apiUrl}/api/clover/checkout`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authPayload.idToken}`,
  },
  body: JSON.stringify({
    items: [{ menuItemId: 'french-fries', name: 'French Fries', price: 499, quantity: 1 }],
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
    locationId: checkoutLocationId,
    notes: 'webhook diag',
    customerName: 'Test',
    customerPhone: '2485550100',
    customerEmail: 'wh@test.com',
    pickupDate: '2026-06-26',
    pickupTime: 'asap',
  }),
}).then((r) => r.json())

if (!checkout.orderId) {
  console.error('Checkout failed:', checkout)
  process.exit(1)
}

console.log('Order:', checkout.orderId, `(${checkoutLocationId})`)
const before = await getOrder(authPayload.idToken, checkout.orderId)
console.log('Before webhook:', before)

const body = JSON.stringify({
  status: 'APPROVED',
  type: 'PAYMENT',
  id: `diag_${Date.now()}`,
  data: checkout.checkoutSessionId,
  merchantId: before.merchantId,
})

const bad = await postWebhook(body, 't=1,v1=bad')
console.log('Bad signature:', bad.status, await bad.text())

const jsonRaw = process.env.CLOVER_LOCATIONS_JSON?.trim()
if (!jsonRaw) {
  console.log('\nCannot test signed webhook — CLOVER_LOCATIONS_JSON is missing locally.')
  console.log('')
  console.log('1. Render Dashboard → shadab-api → Environment')
  console.log('2. Copy the full CLOVER_LOCATIONS_JSON value')
  console.log('3. Create .env.clover.local in the project root (gitignored):')
  console.log('')
  console.log('   CLOVER_LOCATIONS_JSON={"chicago-il":{...},"farmington-hills-mi":{...}}')
  console.log('')
  console.log('   Each webhookSecret = Signing Secret from that location\'s Hosted Checkout page in Clover.')
  console.log('4. Re-run: node scripts/test-clover-webhook-diag.mjs --location farmington-hills-mi')
  console.log('')
  console.log('Also ensure shadab-api on Render is redeployed with multi-secret webhook support.')
  process.exit(0)
}

const locations = JSON.parse(jsonRaw)
const entries = Object.entries(locations).filter(([, v]) => v?.webhookSecret)

console.log(`\nTesting ${entries.length} signing secret(s) against ${apiUrl}/api/clover/webhook ...`)

let confirmed = false
for (const [locId, config] of entries) {
  const { signature } = signBody(body, config.webhookSecret.trim())
  const resp = await postWebhook(body, signature)
  const text = await resp.text()
  console.log(`  [${locId}] ${resp.status}${text ? ` ${text}` : ''}`)
  if (resp.ok) confirmed = true
}

if (!confirmed) {
  console.error('\nNo signing secret was accepted. Update Render CLOVER_LOCATIONS_JSON webhookSecret values.')
  process.exit(1)
}

await new Promise((r) => setTimeout(r, 3000))
const after = await getOrder(authPayload.idToken, checkout.orderId)
console.log('\nAfter webhook:', after)
if (after.status === 'confirmed') {
  console.log('SUCCESS: webhook confirmed the order.')
} else {
  console.log('Webhook returned 200 but order is still pending — check Render logs.')
}
