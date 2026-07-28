import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import * as functions from 'firebase-functions/v2'
import { sendCustomerOrderConfirmationEmail } from '../email/customerOrderConfirmationEmail'
import { getResendMailConfig, resendApiKey } from '../email/resendConfig'
import { hasOrderPayment, orderPaymentJustRecorded } from './orderPayment'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

function formatScheduleValue(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate
    if (typeof toDate === 'function') {
      return toDate.call(value).toISOString().slice(0, 10)
    }
  }
  return String(value)
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export const notifyCustomerOnOrderConfirmed = onDocumentUpdated(
  {
    document: 'orders/{orderId}',
    secrets: [resendApiKey],
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!after) return

    if (!orderPaymentJustRecorded(before, after)) return
    if (after.customerOrderConfirmationSent === true) return
    if (!hasOrderPayment(after)) return

    const toEmail = String(after.guestEmail ?? '').trim()
    if (!toEmail) return

    const orderId = event.params.orderId
    const orderRef = event.data!.after.ref

    const claimedOrder = await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef)
      if (!snap.exists) return null
      const current = snap.data()!
      if (current.customerOrderConfirmationSent === true || !hasOrderPayment(current)) return null
      if (current.status === 'cancelled') return null
      tx.update(orderRef, {
        customerOrderConfirmationSent: true,
        updatedAt: FieldValue.serverTimestamp(),
      })
      return current
    })
    if (!claimedOrder) return

    try {
      await sendCustomerOrderConfirmationEmail(
        {
          orderId,
          toEmail,
          locationId: String(claimedOrder.locationId ?? ''),
          fulfillmentType: String(claimedOrder.fulfillmentType ?? 'pickup'),
          total: Number(claimedOrder.total ?? 0),
          items: Array.isArray(claimedOrder.items) ? claimedOrder.items : [],
          deliveryAddress: claimedOrder.deliveryAddress ?? null,
          scheduledFor: formatScheduleValue(claimedOrder.scheduledFor),
          pickupTime: formatScheduleValue(claimedOrder.pickupTime),
        },
        getResendMailConfig(),
      )
    } catch (error) {
      functions.logger.error('Failed to send customer order confirmation email', {
        orderId,
        error: formatError(error),
      })
      await orderRef.update({
        customerOrderConfirmationSent: false,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  },
)
