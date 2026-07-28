import * as functions from 'firebase-functions/v2'
import { db, FieldValue } from '../db'
import { sendOrderNotificationEmail } from '../email/orderNotification'
import {
  enrichCustomerContactFromUser,
  orderNotificationInputFromDoc,
} from '../email/orderNotificationInput'
import { getResendMailConfig, resendApiKey } from '../email/resendConfig'
import { hasOrderPayment, resolveCloverPaymentId } from './orderPayment'

const POST_PAYMENT_STATUSES = new Set([
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
])

async function notifyStaffForPaidOrder(orderId: string) {
  const orderRef = db.collection('orders').doc(orderId)
  const claimedOrder = await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef)
    if (!snap.exists) return null
    const current = snap.data()!
    if (current.staffNotified === true || !hasOrderPayment(current)) return null
    if (current.status === 'cancelled') return null
    tx.update(orderRef, {
      staffNotified: true,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return current
  })
  if (!claimedOrder) return

  try {
    const input = await enrichCustomerContactFromUser(
      db,
      claimedOrder,
      orderNotificationInputFromDoc(orderId, claimedOrder),
    )
    await sendOrderNotificationEmail(input, getResendMailConfig())
  } catch (err) {
    await orderRef.update({
      staffNotified: false,
      updatedAt: FieldValue.serverTimestamp(),
    })
    throw err
  }
}

export const confirmCloverOrder = functions.https.onCall(
  { invoker: 'public', secrets: [resendApiKey] },
  async (request) => {
    const { auth, data } = request
    if (!auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
    }

    const orderIdInput = String(data?.orderId ?? '').trim()
    const checkoutSessionId = String(data?.checkoutSessionId ?? '').trim()

    if (!checkoutSessionId) {
      throw new functions.https.HttpsError('invalid-argument', 'checkoutSessionId is required')
    }

    let orderId = orderIdInput
    if (!orderId) {
      const sessionSnap = await db
        .collection('orders')
        .where('cloverCheckoutSessionId', '==', checkoutSessionId)
        .limit(1)
        .get()
      if (sessionSnap.empty) {
        throw new functions.https.HttpsError('not-found', 'Order not found for checkout session')
      }
      const sessionOrder = sessionSnap.docs[0]
      if (sessionOrder.data().userId !== auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not your order')
      }
      orderId = sessionSnap.docs[0].id
    }

    const orderRef = db.collection('orders').doc(orderId)

    const confirmResult = await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef)
      if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'Order not found')
      }

      const order = snap.data()!
      if (order.userId !== auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not your order')
      }

      const storedSessionId = String(order.cloverCheckoutSessionId ?? '').trim()
      if (!storedSessionId || storedSessionId !== checkoutSessionId) {
        throw new functions.https.HttpsError('failed-precondition', 'Checkout session mismatch')
      }

      const status = String(order.status ?? '')
      const paymentId = resolveCloverPaymentId(order.cloverPaymentId, checkoutSessionId)
      const needsPaymentBackfill = !String(order.cloverPaymentId ?? '').trim() && !!paymentId
      const needsStaffNotify = order.staffNotified !== true

      const summary = {
        fulfillmentType: order.fulfillmentType,
        total: order.total,
        deliveryFee: order.deliveryFee,
        deliveryAddress: order.deliveryAddress ?? null,
        scheduledFor: order.scheduledFor ?? null,
        pickupTime: order.pickupTime ?? null,
      }

      if (status === 'pending') {
        tx.update(orderRef, {
          status: 'placed',
          cloverPaymentId: paymentId,
          updatedAt: FieldValue.serverTimestamp(),
        })
        return { orderId, status: 'placed' as const, needsStaffNotify: true, ...summary }
      }

      if (POST_PAYMENT_STATUSES.has(status)) {
        if (needsPaymentBackfill) {
          tx.update(orderRef, {
            cloverPaymentId: paymentId,
            updatedAt: FieldValue.serverTimestamp(),
          })
        }
        return {
          orderId,
          status,
          needsStaffNotify: needsStaffNotify && (needsPaymentBackfill || hasOrderPayment(order)),
          ...summary,
        }
      }

      throw new functions.https.HttpsError('failed-precondition', `Order is ${status}`)
    })

    functions.logger.info('Clover order placed after checkout redirect', {
      orderId: confirmResult.orderId,
      checkoutSessionId,
      uid: auth.uid,
      status: confirmResult.status,
      needsStaffNotify: confirmResult.needsStaffNotify,
    })

    if (confirmResult.needsStaffNotify) {
      try {
        await notifyStaffForPaidOrder(confirmResult.orderId)
      } catch (err) {
        functions.logger.error('Staff notification failed after Clover checkout redirect', {
          orderId: confirmResult.orderId,
          err,
        })
      }
    }

    return {
      orderId: confirmResult.orderId,
      status: confirmResult.status,
      fulfillmentType: confirmResult.fulfillmentType,
      total: confirmResult.total,
      deliveryFee: confirmResult.deliveryFee,
      deliveryAddress: confirmResult.deliveryAddress,
      scheduledFor: confirmResult.scheduledFor,
      pickupTime: confirmResult.pickupTime,
    }
  },
)
