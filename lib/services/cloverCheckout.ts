import { getFunctions, httpsCallable } from 'firebase/functions'
import app, { auth } from '../firebase'
import { getApiUrl } from '../../constants/api'
import { SubmitOrderInput } from './orderService'

export interface CloverCheckoutInput extends SubmitOrderInput {
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  pickupDate?: string
  pickupTime?: string
}

export interface CloverCheckoutResult {
  orderId: string
  href: string
  checkoutSessionId: string
  expirationTime?: number
}

export async function startCloverCheckout(
  input: CloverCheckoutInput,
): Promise<CloverCheckoutResult> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Must be signed in to place an order.')
  }

  const token = await user.getIdToken()
  const response = await fetch(`${getApiUrl()}/api/clover/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: input.items,
      subtotal: input.subtotal,
      tax: input.tax,
      serviceFee: input.serviceFee,
      deliveryFee: input.deliveryFee,
      tip: input.tip,
      promoCode: input.promoCode,
      promoDiscount: input.promoDiscount,
      loyaltyPointsUsed: input.loyaltyPointsToRedeem,
      giftCardAmount: input.giftCardAmount,
      total: input.total,
      fulfillmentType: input.fulfillmentType,
      deliveryAddress: input.deliveryAddress,
      locationId: input.locationId,
      notes: input.notes,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      pickupDate: input.pickupDate,
      pickupTime: input.pickupTime,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as CloverCheckoutResult & {
    error?: string
  }

  if (!response.ok) {
    throw new Error(payload.error ?? `Checkout failed (${response.status})`)
  }

  if (!payload.href || !payload.orderId) {
    throw new Error('Payment server returned an invalid checkout session.')
  }

  return payload
}

export function redirectToCloverCheckout(href: string) {
  if (typeof window !== 'undefined') {
    window.location.assign(href)
    return
  }
  throw new Error('Clover checkout redirect is only supported on web.')
}

const CHECKOUT_CONTEXT_KEY = 'shadab_checkout_context'

export interface CheckoutContext {
  fulfillment: string
  address: string
  pickupSchedule: string
  total: string
}

export function saveCheckoutContext(context: CheckoutContext) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(CHECKOUT_CONTEXT_KEY, JSON.stringify(context))
  } catch {
    // ignore quota / private mode
  }
}

export function readCheckoutContext(): CheckoutContext | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_CONTEXT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CheckoutContext
  } catch {
    return null
  }
}

export function clearCheckoutContext() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY)
  } catch {
    // ignore
  }
}

export interface ConfirmedCloverOrder {
  orderId: string
  status: string
  fulfillmentType: 'delivery' | 'pickup'
  total: number
  deliveryFee: number
  deliveryAddress: {
    street: string
    city: string
    state: string
    zip: string
    unit?: string
  } | null
  scheduledFor: string | null
  pickupTime: string | null
}

export async function confirmCloverOrderAfterRedirect(
  checkoutSessionId: string,
  orderId?: string,
): Promise<ConfirmedCloverOrder | null> {
  const user = auth.currentUser
  if (!user) return null

  const functions = getFunctions(app, 'us-central1')
  const confirm = httpsCallable(functions, 'confirmCloverOrder')
  const result = await confirm({
    checkoutSessionId,
    ...(orderId?.trim() ? { orderId: orderId.trim() } : {}),
  })
  return result.data as ConfirmedCloverOrder
}
