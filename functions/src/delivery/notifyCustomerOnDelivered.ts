import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import * as functions from 'firebase-functions/v2'
import { sendCustomerDeliveredEmail } from '../email/customerDeliveredEmail'
import { resendApiKey, resendFromEmail } from '../email/resendConfig'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

export const notifyCustomerOnDelivered = onDocumentUpdated(
  { document: 'orders/{orderId}', secrets: [resendApiKey] },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    if (before.status === after.status || after.status !== 'delivered') return
    if (after.fulfillmentType !== 'delivery') return
    if (after.customerDeliveredEmailSent === true) return

    const toEmail = String(after.guestEmail ?? '').trim()
    if (!toEmail) return

    const orderId = event.params.orderId
    const orderRef = event.data!.after.ref

    const claimedOrder = await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef)
      if (!snap.exists) return null
      const current = snap.data()!
      if (current.customerDeliveredEmailSent === true) return null
      tx.update(orderRef, {
        customerDeliveredEmailSent: true,
        updatedAt: FieldValue.serverTimestamp(),
      })
      return current
    })
    if (!claimedOrder) return

    try {
      await sendCustomerDeliveredEmail(
        {
          orderId,
          toEmail,
          total: Number(claimedOrder.total ?? 0),
          items: Array.isArray(claimedOrder.items) ? claimedOrder.items : [],
        },
        {
          apiKey: resendApiKey.value().trim(),
          fromEmail: resendFromEmail.value().trim() || 'orders@shadab.com',
          toEmail: '',
        },
      )
    } catch (error) {
      functions.logger.error('Failed to send customer delivered email', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      })
      await orderRef.update({
        customerDeliveredEmailSent: false,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  },
)
