import { FieldValue } from 'firebase-admin/firestore'
import { calculateTotal, calculateTax, calculateServiceFee } from '../lib/cartTotals'
import { calculateEarnedPoints, loyaltyDiscountCents, validateRedemption } from '../lib/loyalty'
import { computeDeliveryFee, DELIVERY_MINIMUM_SUBTOTAL_CENTS } from '../lib/deliveryPricing'
import { db } from '../lib/firebase'
import { CloverLineItem } from './cloverClient'
import { trySendStaffOrderNotification } from './orderNotification'
import { hasOrderPayment, resolveCloverPaymentId } from '../lib/orderPayment'

const POST_PAYMENT_STATUSES = new Set([
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
])

export interface OrderItemInput {
  menuItemId: string
  name: string
  price: number
  quantity: number
  instructions?: string
}

export interface DeliveryAddressInput {
  street: string
  city: string
  state: string
  zip: string
  country?: string
  label?: string
  unit?: string
  instructions?: string
}

export interface CreatePendingOrderInput {
  cloverMerchantId?: string
  uid: string
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  items: OrderItemInput[]
  subtotal: number
  tax: number
  serviceFee: number
  deliveryFee: number
  tip: number
  promoCode?: string
  promoDiscount?: number
  loyaltyPointsUsed?: number
  giftCardAmount?: number
  total: number
  fulfillmentType: 'delivery' | 'pickup'
  deliveryAddress?: DeliveryAddressInput | null
  locationId: string
  notes?: string
  pickupDate?: string
  pickupTime?: string
}

export interface CreatePendingOrderResult {
  orderId: string
  lineItems: CloverLineItem[]
  customer: {
    email: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
  }
}

function isUnpaidPending(data: Record<string, unknown>): boolean {
  return (
    data.status === 'pending' &&
    !String(data.cloverPaymentId ?? '').trim()
  )
}

/** Cancel stale checkout attempts so only successful payments become real orders. */
export async function cancelAbandonedPendingOrders(uid: string): Promise<void> {
  const snapshot = await db.collection('orders').where('userId', '==', uid).where('status', '==', 'pending').get()
  const cutoffMs = Date.now() - 2 * 60 * 60 * 1000

  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (!isUnpaidPending(data)) continue

    const createdAt = data.createdAt?.toDate?.()?.getTime?.() ?? Date.now()
    if (createdAt < cutoffMs) continue

    await cancelUnpaidPendingOrder(doc.id, uid)
  }
}

export async function cancelUnpaidPendingOrder(orderId: string, uid: string): Promise<void> {
  const orderRef = db.collection('orders').doc(orderId)
  const userRef = db.collection('users').doc(uid)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef)
    if (!snap.exists) return

    const order = snap.data()!
    if (order.userId !== uid || !isUnpaidPending(order)) return

    tx.update(orderRef, {
      status: 'cancelled',
      cancelledReason: 'abandoned_checkout',
      updatedAt: FieldValue.serverTimestamp(),
    })

    const loyaltyUsed = Number(order.loyaltyPointsUsed ?? 0)
    if (loyaltyUsed > 0) {
      tx.update(userRef, {
        loyaltyPoints: FieldValue.increment(loyaltyUsed),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  })
}

export async function createPendingOrder(
  input: CreatePendingOrderInput,
): Promise<CreatePendingOrderResult> {
    if (!input.items.length) {
    throw new Error('Cart is empty')
  }

  let deliveryDistanceMiles: number | undefined

  if (input.fulfillmentType === 'delivery') {
    const phoneDigits = (input.customerPhone ?? '').replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      throw new Error('Valid phone number is required for delivery orders')
    }
    if (!input.deliveryAddress?.street?.trim() || !input.deliveryAddress?.city?.trim()) {
      throw new Error('Complete delivery address is required')
    }
    if (input.subtotal < DELIVERY_MINIMUM_SUBTOTAL_CENTS) {
      throw new Error(
        `Minimum order for delivery is $${(DELIVERY_MINIMUM_SUBTOTAL_CENTS / 100).toFixed(2)}`,
      )
    }

    const { feeCents, distanceMiles } = await computeDeliveryFee({
      locationId: input.locationId,
      deliveryAddress: input.deliveryAddress,
    })
    deliveryDistanceMiles = distanceMiles

    if (feeCents !== input.deliveryFee) {
      throw new Error('Delivery fee does not match server calculation. Please refresh your delivery quote.')
    }
  }

  const tax = calculateTax(input.subtotal)
  const serviceFee = calculateServiceFee(input.subtotal)
  const expectedTotal = calculateTotal({
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    tip: input.tip,
    promoDiscount: input.promoDiscount,
    loyaltyPointsUsed: input.loyaltyPointsUsed,
    giftCardAmount: input.giftCardAmount,
  })

  if (input.tax !== tax || input.serviceFee !== serviceFee || input.total !== expectedTotal) {
    throw new Error('Order totals do not match server calculation')
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentOrders = await db
    .collection('orders')
    .where('userId', '==', input.uid)
    .where('createdAt', '>=', oneHourAgo)
    .count()
    .get()

  if (recentOrders.data().count >= 5) {
    throw new Error('Order limit reached. Try again later.')
  }

  await cancelAbandonedPendingOrders(input.uid)

  const orderRef = db.collection('orders').doc()
  const userRef = db.collection('users').doc(input.uid)
  const loyaltyPointsEarned = calculateEarnedPoints(input.subtotal)
  const loyaltyPointsUsed = input.loyaltyPointsUsed ?? 0

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef)
    let loyaltyBalance = 0

    if (!userSnap.exists) {
      const email = input.customerEmail?.trim()
      if (!email) {
        throw new Error('Customer email is required for Clover checkout')
      }

      tx.set(userRef, {
        uid: input.uid,
        email,
        displayName: input.customerName?.trim() ?? '',
        phone: input.customerPhone?.trim() ?? '',
        photoURL: '',
        isGuest: true,
        addresses: [],
        defaultAddressId: '',
        loyaltyPoints: 0,
        loyaltyTier: 'bronze',
        totalOrderCount: 0,
        totalSpend: 0,
        dietaryPreferences: [],
        pushToken: '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    } else {
      loyaltyBalance = userSnap.data()?.loyaltyPoints ?? 0
      const existingEmail = String(userSnap.data()?.email ?? '').trim()
      const nextEmail = input.customerEmail?.trim() ?? ''

      if (nextEmail && !existingEmail) {
        tx.update(userRef, {
          email: nextEmail,
          ...(input.customerPhone?.trim() ? { phone: input.customerPhone.trim() } : {}),
          ...(input.customerName?.trim() ? { displayName: input.customerName.trim() } : {}),
          isGuest: true,
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
    }

    validateRedemption(loyaltyPointsUsed, loyaltyBalance)

    const order = {
      id: orderRef.id,
      userId: input.uid,
      guestName: input.customerName?.trim() ?? '',
      guestEmail: input.customerEmail?.trim() ?? '',
      guestPhone: input.customerPhone?.trim() ?? '',
      locationId: input.locationId,
      items: input.items,
      subtotal: input.subtotal,
      tax,
      deliveryFee: input.deliveryFee,
      ...(deliveryDistanceMiles != null ? { deliveryDistanceMiles } : {}),
      serviceFee,
      tip: input.tip,
      promoCode: input.promoCode ?? '',
      promoDiscount: input.promoDiscount ?? 0,
      loyaltyPointsUsed,
      loyaltyPointsEarned,
      loyaltyAwarded: false,
      giftCardAmount: input.giftCardAmount ?? 0,
      total: expectedTotal,
      fulfillmentType: input.fulfillmentType,
      scheduledFor: input.pickupDate || null,
      pickupTime: input.pickupTime || null,
      deliveryAddress: input.deliveryAddress ?? null,
      status: 'pending',
      cloverMerchantId: input.cloverMerchantId ?? '',
      cloverCheckoutSessionId: '',
      cloverPaymentId: '',
      notes: input.notes ?? '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    tx.set(orderRef, order)

    if (loyaltyPointsUsed > 0) {
      tx.update(userRef, {
        loyaltyPoints: FieldValue.increment(-loyaltyPointsUsed),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  })

  const lineItems = buildCloverLineItems(input, tax, serviceFee)
  const customer = buildCustomer(input)

  return { orderId: orderRef.id, lineItems, customer }
}

export async function attachCheckoutSession(orderId: string, checkoutSessionId: string) {
  await db.collection('orders').doc(orderId).update({
    cloverCheckoutSessionId: checkoutSessionId,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function markOrderPaidByCheckoutSession(
  checkoutSessionId: string,
  paymentId: string,
): Promise<string | null> {
  const snapshot = await db
    .collection('orders')
    .where('cloverCheckoutSessionId', '==', checkoutSessionId)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  const orderData = doc.data()
  const currentStatus = orderData.status as string
  const resolvedPaymentId = resolveCloverPaymentId(paymentId, checkoutSessionId)
  const needsPaymentBackfill =
    !String(orderData.cloverPaymentId ?? '').trim() && !!resolvedPaymentId

  if (currentStatus === 'cancelled') {
    console.warn('[orderService] Ignoring payment for cancelled order', {
      orderId: doc.id,
      checkoutSessionId,
    })
    return null
  }

  if (POST_PAYMENT_STATUSES.has(currentStatus)) {
    if (needsPaymentBackfill) {
      await doc.ref.update({
        cloverPaymentId: resolvedPaymentId,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    if (orderData.staffNotified !== true && (needsPaymentBackfill || hasOrderPayment(orderData))) {
      void trySendStaffOrderNotification(db, doc.id)
    }
    return doc.id
  }

  await doc.ref.update({
    status: 'placed',
    cloverPaymentId: resolvedPaymentId,
    updatedAt: FieldValue.serverTimestamp(),
  })

  void trySendStaffOrderNotification(db, doc.id)

  return doc.id
}

export async function markOrderDeclinedByCheckoutSession(checkoutSessionId: string) {
  const snapshot = await db
    .collection('orders')
    .where('cloverCheckoutSessionId', '==', checkoutSessionId)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  const currentStatus = doc.data().status as string
  if (currentStatus !== 'pending') {
    return doc.id
  }

  await doc.ref.update({
    status: 'cancelled',
    updatedAt: FieldValue.serverTimestamp(),
  })

  return doc.id
}

function buildCustomer(input: CreatePendingOrderInput) {
  const email = input.customerEmail?.trim()
  if (!email) {
    throw new Error('Customer email is required for Clover checkout')
  }

  const [firstName, ...rest] = (input.customerName ?? '').trim().split(/\s+/)
  const lastName = rest.join(' ')

  return {
    email,
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(input.customerPhone ? { phoneNumber: input.customerPhone } : {}),
  }
}

function formatDeliveryAddressForTicket(addr: DeliveryAddressInput): string {
  const street = addr.unit?.trim() ? `${addr.street}, ${addr.unit}` : addr.street
  return `${street}, ${addr.city}, ${addr.state} ${addr.zip}`
}

/** Printed as the first line item so a driver can grab the ticket and immediately see where it's going. */
function buildFulfillmentHeaderLineItem(input: CreatePendingOrderInput): CloverLineItem {
  if (input.fulfillmentType === 'delivery' && input.deliveryAddress) {
    const addressLine = formatDeliveryAddressForTicket(input.deliveryAddress)
    const instructions = input.deliveryAddress.instructions?.trim()
    const phone = input.customerPhone?.trim()
    const noteParts = [
      addressLine,
      instructions ? `Note: ${instructions}` : null,
      phone ? `Ph: ${phone}` : null,
    ].filter(Boolean)

    return {
      name: '*** DELIVERY ORDER ***',
      price: 0,
      unitQty: 1,
      note: noteParts.join(' | '),
    }
  }

  return { name: '*** PICKUP ORDER ***', price: 0, unitQty: 1 }
}

function buildCloverLineItems(
  input: CreatePendingOrderInput,
  tax: number,
  serviceFee: number,
): CloverLineItem[] {
  const lineItems: CloverLineItem[] = [
    buildFulfillmentHeaderLineItem(input),
    ...input.items.map((item) => ({
      name: item.name,
      price: item.price,
      unitQty: item.quantity,
      ...(item.instructions ? { note: item.instructions } : {}),
    })),
  ]

  if (serviceFee > 0) {
    lineItems.push({ name: 'Service fee', price: serviceFee, unitQty: 1 })
  }

  if (input.deliveryFee > 0) {
    lineItems.push({ name: 'Delivery fee', price: input.deliveryFee, unitQty: 1 })
  }

  if (tax > 0) {
    lineItems.push({ name: 'Tax', price: tax, unitQty: 1 })
  }

  if (input.tip > 0) {
    lineItems.push({ name: 'Tip', price: input.tip, unitQty: 1 })
  }

  const discount =
    (input.promoDiscount ?? 0) +
    loyaltyDiscountCents(input.loyaltyPointsUsed ?? 0) +
    (input.giftCardAmount ?? 0)

  if (discount > 0) {
    lineItems.push({ name: 'Discount', price: -discount, unitQty: 1 })
  }

  const sum = lineItems.reduce((total, item) => total + item.price * item.unitQty, 0)
  if (sum !== input.total) {
    throw new Error('Clover line items do not match order total')
  }

  return lineItems
}
