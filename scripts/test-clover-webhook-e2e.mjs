/**
 * E2E: Clover checkout -> signed webhook -> confirmed -> staff email.
 *
 * Requires CLOVER_LOCATIONS_JSON in .env (copy from Render) OR per-location vars:
 *   CLOVER_LOCATION_NORTHVILLE_MI_MERCHANT_ID
 *   CLOVER_LOCATION_NORTHVILLE_MI_WEBHOOK_SECRET
 *
 * Usage:
 *   npm run test:clover-webhook-e2e
 *   node scripts/test-clover-webhook-e2e.mjs --location chicago-il
 */
import { config as loadEnv } from 'dotenv'
import { createHmac } from 'crypto'

loadEnv({ path: '.env' })
loadEnv({ path: 'server/.env', override: true })

const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '')
const authReferer = process.env.E2E_AUTH_REFERER || 'https://shadab.com/'
const locationId = process.argv.includes('--location')
  ? process.argv[process.argv.indexOf('--location') + 1]
  : 'chicago-il'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getCloverConfig(locId) {
  const jsonRaw = process.env.CLOVER_LOCATIONS_JSON?.trim()
  if (jsonRaw) {
    const parsed = JSON.parse(jsonRaw)
    const entry = parsed[locId]
    if (!entry?.merchantId || !entry?.webhookSecret) {
      throw new Error(`CLOVER_LOCATIONS_JSON missing entry for ${locId}`)
    }
    return { merchantId: entry.merchantId.trim(), webhookSecret: entry.webhookSecret.trim() }
  }

  const prefix = `CLOVER_LOCATION_${locId.replace(/-/g, '_').toUpperCase()}`
  const merchantId = process.env[`${prefix}_MERCHANT_ID`]?.trim()
  const webhookSecret = process.env[`${prefix}_WEBHOOK_SECRET`]?.trim()
  if (!merchantId || !webhookSecret) {
    throw new Error(
      'Set CLOVER_LOCATIONS_JSON in .env (copy from Render) or CLOVER_LOCATION_*_WEBHOOK_SECRET vars',
    )
  }
  return { merchantId, webhookSecret }
}

async function firebaseAuth(path, body) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: authReferer },
      body: JSON.stringify(body),
    },
  )
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error?.message ?? 'Auth failed')
  return payload
}

function fieldValue(fields, key) {
  const f = fields[key]
  if (!f) return null
  if (f.stringValue !== undefined) return f.stringValue
  if (f.booleanValue !== undefined) return f.booleanValue
  return null
}

async function getOrder(idToken, orderId) {
  const dbId = encodeURIComponent(process.env.EXPO_PUBLIC_FIRESTORE_DATABASE_ID || '(default)')
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/orders/${orderId}`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } })
  if (!response.ok) return null
  const doc = await response.json()
  const fields = doc.fields ?? {}
  return {
    status: fieldValue(fields, 'status'),
    staffNotified: fieldValue(fields, 'staffNotified'),
    cloverPaymentId: fieldValue(fields, 'cloverPaymentId'),
    cloverCheckoutSessionId: fieldValue(fields, 'cloverCheckoutSessionId'),
    cloverMerchantId: fieldValue(fields, 'cloverMerchantId'),
  }
}

function signCloverWebhook(rawBody, webhookSecret) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${rawBody}`
  const v1 = createHmac('sha256', webhookSecret).update(signedPayload, 'utf8').digest('hex')
  return { signature: `t=${timestamp},v1=${v1}`, timestamp }
}

async function main() {
  const clover = getCloverConfig(locationId)
  const runId = Date.now()
  const email = `e2e.webhook.${runId}@mailinator.com`
  const authPayload = await firebaseAuth('accounts:signUp', {
    email,
    password: `Webhook${runId}!Aa`,
    returnSecureToken: true,
  })

  const subtotal = 499
  const tax = Math.round(subtotal * 0.06)
  const serviceFee = Math.round(subtotal * 0.03)
  const total = subtotal + tax + serviceFee

  console.log(`[1/4] Creating pending order via Render checkout (${locationId})...`)
  const checkoutResp = await fetch(`${apiUrl}/api/clover/checkout`, {
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
      locationId,
      notes: `Clover webhook e2e ${runId}`,
      customerName: 'Webhook E2E Test',
      customerPhone: '2485550100',
      customerEmail: email,
      pickupDate: new Date().toISOString().slice(0, 10),
      pickupTime: 'asap',
    }),
  })

  const checkout = await checkoutResp.json()
  if (!checkoutResp.ok) throw new Error(checkout.error ?? `Checkout failed (${checkoutResp.status})`)

  console.log(`  orderId: ${checkout.orderId}`)
  console.log(`  checkoutSessionId: ${checkout.checkoutSessionId}`)

  const before = await getOrder(authPayload.idToken, checkout.orderId)
  console.log('[2/4] Before webhook:', before)

  const paymentId = `e2e_pay_${runId}`
  const webhookBody = JSON.stringify({
    status: 'APPROVED',
    type: 'PAYMENT',
    id: paymentId,
    data: checkout.checkoutSessionId,
    merchantId: clover.merchantId,
  })
  const { signature } = signCloverWebhook(webhookBody, clover.webhookSecret)

  console.log('[3/4] POST signed Clover webhook to Render...')
  const webhookResp = await fetch(`${apiUrl}/api/clover/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Clover-Signature': signature,
    },
    body: webhookBody,
  })

  const webhookText = await webhookResp.text()
  console.log(`  webhook response: ${webhookResp.status}${webhookText ? ` ${webhookText}` : ''}`)
  if (!webhookResp.ok) {
    throw new Error(`Clover webhook rejected: ${webhookResp.status} ${webhookText}`)
  }

  console.log('[4/4] Waiting for order confirm + email trigger...')
  for (let attempt = 1; attempt <= 12; attempt++) {
    await sleep(2500)
    const order = await getOrder(authPayload.idToken, checkout.orderId)
    console.log(
      `  poll ${attempt}: status=${order?.status}, cloverPaymentId=${order?.cloverPaymentId ? 'set' : 'null'}, staffNotified=${order?.staffNotified ?? 'null'}`,
    )
    if (order?.status === 'confirmed' && order?.staffNotified === true) {
      console.log('\nSUCCESS: Clover webhook confirmed order and staff email was triggered.')
      console.log(`Order: ${checkout.orderId}`)
      return
    }
    if (order?.status === 'confirmed' && order?.staffNotified !== true) {
      // Email trigger may lag slightly after confirm
      continue
    }
  }

  throw new Error('Webhook did not confirm order or staffNotified was not set')
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
