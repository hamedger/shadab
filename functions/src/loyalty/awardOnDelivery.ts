import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

export const awardLoyaltyOnDelivery = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  if (!before || !after) return

  const isFulfilled =
    after.status === 'delivered' ||
    (after.fulfillmentType === 'pickup' && after.status === 'picked_up')
  if (before.status === after.status || !isFulfilled) return
  if (after.loyaltyAwarded === true) return
  if (!after.userId || after.userId === 'guest') return

  const earned = after.loyaltyPointsEarned ?? 0
  if (earned <= 0) return

  const orderRef = event.data!.after.ref
  const userRef = db.collection('users').doc(after.userId)

  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef)
    const order = orderSnap.data()
    if (!order || order.loyaltyAwarded === true) return

    tx.update(orderRef, {
      loyaltyAwarded: true,
      updatedAt: FieldValue.serverTimestamp(),
    })
    tx.update(userRef, {
      loyaltyPoints: FieldValue.increment(earned),
      totalOrderCount: FieldValue.increment(1),
      totalSpend: FieldValue.increment(order.total ?? 0),
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
})
