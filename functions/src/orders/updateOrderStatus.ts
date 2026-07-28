import * as functions from 'firebase-functions/v2'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { isAdminUser } from '../admin/isAdmin'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

const USER_CANCELLABLE_STATUSES = ['pending', 'placed', 'confirmed', 'preparing']

export const updateOrderStatus = functions.https.onCall(async (request) => {
  const { auth, data } = request
  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')

  const isAdmin = await isAdminUser(auth.uid)

  const { orderId, status } = data
  const validStatuses = ['pending', 'placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid status')
  }

  const orderRef = db.collection('orders').doc(orderId)
  const orderSnap = await orderRef.get()
  if (!orderSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Order not found')
  }

  const order = orderSnap.data() as {
    userId?: string
    status?: string
    fulfillmentType?: string
  }

  if (!isAdmin) {
    if (status !== 'cancelled') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can update order status')
    }
    if (order.userId !== auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You can only cancel your own orders')
    }
    if (!order.status || !USER_CANCELLABLE_STATUSES.includes(order.status)) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This order can no longer be cancelled online. Please call the restaurant.',
      )
    }
  }
  await db.collection('orders').doc(orderId).update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Loyalty points are awarded by the awardLoyaltyOnDelivery Firestore trigger.

  return { success: true }
})
