/**
 * E2E: 2 orders per location (guest + registered), French Fries, full Clover payment, admin check.
 *
 * Uses Firebase REST (with localhost Referer) + checkout API from Node; Playwright for Clover + admin UI.
 *
 * Usage:
 *   node scripts/e2e-multi-location-orders.mjs
 */
import { chromium } from 'playwright'
import { config as loadEnv } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(__dirname, '../.env') })

const BASE_URL = (process.env.E2E_BASE_URL || 'http://localhost:8081').replace(/\/$/, '')
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://shadab-api.onrender.com').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD
const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY
const FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
const AUTH_REFERER = process.env.E2E_AUTH_REFERER || 'http://localhost:8081/'
const RUN_ID = Date.now()

const LOCATIONS = [
  { id: 'chicago-il', label: 'Northville' },
  { id: 'farmington-hills-mi', label: 'Farmington Hills' },
]

const FRENCH_FRIES = {
  menuItemId: 'french-fries',
  name: 'French Fries',
  price: 499,
  quantity: 1,
}

const CLOVER_CARD = {
  number: '6011361000006668',
  exp: '12/30',
  cvv: '123',
  zip: '48168',
}

const results = []

function log(msg) {
  console.log(`[e2e ${new Date().toISOString()}] ${msg}`)
}

function calcTotals(subtotal, deliveryFee = 0) {
  const tax = Math.round(subtotal * 0.06)
  const serviceFee = Math.round(subtotal * 0.03)
  const total = subtotal + tax + serviceFee + deliveryFee
  return { subtotal, tax, serviceFee, deliveryFee, tip: 0, total }
}

function requireEnv() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Missing admin credentials in .env')
  if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID) throw new Error('Missing Firebase env vars in .env')
}

async function firebaseAuth(path, body) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: AUTH_REFERER,
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

async function authGuest(tag) {
  try {
    const payload = await firebaseAuth('accounts:signUp', { returnSecureToken: true })
    return {
      uid: payload.localId,
      idToken: payload.idToken,
      email: `e2e.guest.${tag}.${RUN_ID}@mailinator.com`,
      name: `E2E Guest ${tag}`,
      phone: '2485550100',
    }
  } catch {
    const email = `e2e.guest.${tag}.${RUN_ID}@mailinator.com`
    const password = `Guest${RUN_ID}!Aa`
    const payload = await firebaseAuth('accounts:signUp', {
      email,
      password,
      returnSecureToken: true,
    })
    return {
      uid: payload.localId,
      idToken: payload.idToken,
      email,
      name: `E2E Guest ${tag}`,
      phone: '2485550100',
    }
  }
}

async function authRegistered(creds) {
  let payload
  try {
    payload = await firebaseAuth('accounts:signInWithPassword', {
      email: creds.email,
      password: creds.password,
      returnSecureToken: true,
    })
  } catch {
    payload = await firebaseAuth('accounts:signUp', {
      email: creds.email,
      password: creds.password,
      returnSecureToken: true,
    })
  }
  return {
    uid: payload.localId,
    idToken: payload.idToken,
    email: creds.email,
    name: 'E2E Registered User',
    phone: '2485550199',
  }
}

async function refreshIdToken(refreshToken) {
  const payload = await firebaseAuth('token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
  return payload.id_token
}

async function getFirestoreOrder(orderId, idToken) {
  const dbId = process.env.EXPO_PUBLIC_FIRESTORE_DATABASE_ID || '(default)'
  const encodedDb = encodeURIComponent(dbId)
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${encodedDb}/documents/orders/${orderId}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  })
  if (!response.ok) return null
  const doc = await response.json()
  const fields = doc.fields ?? {}
  const str = (key) => fields[key]?.stringValue ?? null
  const items = fields.items?.arrayValue?.values?.map((v) => v.mapValue?.fields?.name?.stringValue) ?? []
  return {
    status: str('status'),
    locationId: str('locationId'),
    cloverPaymentId: str('cloverPaymentId'),
    items,
  }
}

async function startCheckout(customer, locationId, idToken) {
  const items = [FRENCH_FRIES]
  const { subtotal, tax, serviceFee, deliveryFee, tip, total } = calcTotals(FRENCH_FRIES.price)

  const response = await fetch(`${API_URL}/api/clover/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      items,
      subtotal,
      tax,
      serviceFee,
      deliveryFee,
      tip,
      promoCode: '',
      promoDiscount: 0,
      loyaltyPointsUsed: 0,
      giftCardAmount: 0,
      total,
      fulfillmentType: 'pickup',
      deliveryAddress: null,
      locationId,
      notes: `E2E test ${RUN_ID}`,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      pickupDate: new Date().toISOString().slice(0, 10),
      pickupTime: 'asap',
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error ?? `Checkout API failed (${response.status})`)
  }
  return payload
}

async function payOnClover(page, href) {
  await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 90000 })

  const cardInput = page
    .locator(
      'input[name="cardNumber"], input[autocomplete="cc-number"], input[placeholder*="Card"], input[aria-label*="Card"]',
    )
    .first()
  await cardInput.waitFor({ state: 'visible', timeout: 60000 })
  await cardInput.fill(CLOVER_CARD.number)

  for (const [sel, value] of [
    ['input[name="cardExpiry"], input[autocomplete="cc-exp"], input[placeholder*="MM"]', CLOVER_CARD.exp],
    ['input[name="cardCvv"], input[autocomplete="cc-csc"], input[placeholder*="CVV"]', CLOVER_CARD.cvv],
    ['input[name="postalCode"], input[autocomplete="postal-code"], input[placeholder*="ZIP"]', CLOVER_CARD.zip],
  ]) {
    const input = page.locator(sel).first()
    if (await input.isVisible().catch(() => false)) await input.fill(value)
  }

  await page.getByRole('button', { name: /pay|submit|complete/i }).first().click()
  await page.waitForURL(/success|Payment Received|checkout\/success|Payment Confirmed/i, {
    timeout: 120000,
  })
}

async function waitForOrderConfirmed(orderId, idToken, maxMs = 120000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const order = await getFirestoreOrder(orderId, idToken)
    if (order && (order.status === 'confirmed' || order.cloverPaymentId)) {
      return order
    }
    await new Promise((r) => setTimeout(r, 4000))
  }
  throw new Error(`Order ${orderId} not confirmed within ${maxMs / 1000}s`)
}

async function placeOrder(page, { locationId, locationLabel, authType, registeredCreds, tag }) {
  const label = `${locationLabel} (${authType})`
  log(`Starting order: ${label}`)

  try {
    const customer =
      authType === 'guest' ? await authGuest(tag) : await authRegistered(registeredCreds)

    const session = await startCheckout(customer, locationId, customer.idToken)
    log(`  Checkout session: orderId=${session.orderId}`)

    await payOnClover(page, session.href)

    const order = await waitForOrderConfirmed(session.orderId, customer.idToken)
    log(
      `✓ ${label} — paid, status=${order.status}, cloverPaymentId=${order.cloverPaymentId ?? 'pending'}`,
    )

    results.push({
      locationId,
      locationLabel,
      authType,
      orderId: session.orderId,
      success: true,
      cloverPaymentId: order.cloverPaymentId,
      error: null,
    })
    return { orderId: session.orderId, idToken: customer.idToken }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(`✗ ${label} — ${message}`)
    await page.screenshot({ path: `scripts/e2e-failure-${tag}.png`, fullPage: true }).catch(() => {})
    results.push({
      locationId,
      locationLabel,
      authType,
      orderId: null,
      success: false,
      cloverPaymentId: null,
      error: message,
    })
    return null
  }
}

async function verifyAdminOrders(page, orderIds) {
  log('Verifying orders on admin page…')
  page.on('dialog', (d) => d.accept())

  await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.getByPlaceholder('admin@shadab.com').fill(ADMIN_EMAIL)
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD)
  await page.getByText('Sign In', { exact: true }).last().click()
  await page.waitForURL(/admin\/orders/, { timeout: 60000 })
  await page.getByText('Orders').first().waitFor({ timeout: 30000 })

  const body = await page.textContent('body')
  const frenchFriesCount = (body?.match(/French Fries/g) ?? []).length
  const foundIds = orderIds.filter((id) => id && body?.includes(id.slice(-6).toUpperCase()))
  return { frenchFriesCount, foundIds }
}

async function main() {
  requireEnv()

  const registeredCreds = {
    email: process.env.E2E_REGISTERED_EMAIL || `e2e.registered.${RUN_ID}@mailinator.com`,
    password: process.env.E2E_REGISTERED_PASSWORD || `E2eReg${RUN_ID}!`,
  }

  if (!process.env.E2E_REGISTERED_EMAIL) {
    await firebaseAuth('accounts:signUp', {
      email: registeredCreds.email,
      password: registeredCreds.password,
      returnSecureToken: true,
    })
    log(`Created registered test user: ${registeredCreds.email}`)
  } else {
    log(`Using registered user: ${registeredCreds.email}`)
  }

  log(`API URL: ${API_URL}`)
  log(`Admin UI URL: ${BASE_URL}`)
  log(`Run ID: ${RUN_ID}`)

  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const page = await browser.newPage()

  const orderIds = []

  for (const loc of LOCATIONS) {
    const guest = await placeOrder(page, {
      locationId: loc.id,
      locationLabel: loc.label,
      authType: 'guest',
      tag: `${loc.id}-guest`,
    })
    if (guest) orderIds.push(guest.orderId)

    const reg = await placeOrder(page, {
      locationId: loc.id,
      locationLabel: loc.label,
      authType: 'registered',
      registeredCreds,
      tag: `${loc.id}-registered`,
    })
    if (reg) orderIds.push(reg.orderId)
  }

  let adminCheck = { frenchFriesCount: 0, foundIds: [] }
  try {
    adminCheck = await verifyAdminOrders(page, orderIds)
  } catch (e) {
    log(`Admin UI check failed: ${e instanceof Error ? e.message : e}`)
  }

  await browser.close()

  console.log('\n========== E2E RESULTS ==========')
  for (const r of results) {
    const status = r.success ? 'PASS' : 'FAIL'
    console.log(
      `${status} | ${r.locationLabel} | ${r.authType} | order=${r.orderId ?? '—'} | clover=${r.cloverPaymentId ?? '—'}${r.error ? ` | ${r.error}` : ''}`,
    )
  }
  console.log('--- Admin UI ---')
  console.log(`  French Fries mentions: ${adminCheck.frenchFriesCount}`)
  console.log(
    `  Matched order IDs: ${adminCheck.foundIds.map((id) => id.slice(-6).toUpperCase()).join(', ') || 'none'}`,
  )
  console.log('=================================\n')

  const allPaid = results.filter((r) => r.success).length === 4
  process.exit(allPaid ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
