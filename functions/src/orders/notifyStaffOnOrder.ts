import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import * as functions from 'firebase-functions/v2'
import { sendOrderNotificationEmail } from '../email/orderNotification'
import {
  enrichCustomerContactFromUser,
  orderNotificationInputFromDoc,
} from '../email/orderNotificationInput'
import { getResendMailConfig, resendApiKey } from '../email/resendConfig'
import { hasOrderPayment, orderPaymentJustRecorded } from './orderPayment'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export const notifyStaffOnOrder = onDocumentUpdated(
  {
    document: 'orders/{orderId}',
    secrets: [resendApiKey],
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!after) return

    if (!orderPaymentJustRecorded(before, after)) return
    if (after.staffNotified === true) return
    if (!hasOrderPayment(after)) return

    const orderId = event.params.orderId
    const orderRef = event.data!.after.ref

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
    } catch (error) {
      functions.logger.error('Failed to send order notification email', {
        orderId,
        error: formatError(error),
      })
      await orderRef.update({
        staffNotified: false,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  },
)
