import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import * as functions from 'firebase-functions/v2'
import { sendCustomerReservationConfirmationEmail } from '../email/customerReservationConfirmationEmail'
import { getResendMailConfig, resendApiKey } from '../email/resendConfig'

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * Emails the guest once a reservation is paid (pending → confirmed), whether the
 * Clover webhook or the post-redirect callable confirmed it.
 */
export const notifyCustomerOnReservationConfirmed = onDocumentUpdated(
  {
    document: 'reservations/{reservationId}',
    secrets: [resendApiKey],
  },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!after) return
    if (before?.status === 'confirmed' || after.status !== 'confirmed') return
    if (after.customerConfirmationSent === true) return

    const toEmail = String(after.email ?? '').trim()
    if (!toEmail) return

    const reservationId = event.params.reservationId
    const ref = event.data!.after.ref

    const claimed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) return null
      const current = snap.data()!
      if (current.customerConfirmationSent === true || current.status !== 'confirmed') return null
      tx.update(ref, { customerConfirmationSent: true, updatedAt: FieldValue.serverTimestamp() })
      return current
    })
    if (!claimed) return

    try {
      await sendCustomerReservationConfirmationEmail(
        {
          reservationId,
          toEmail,
          name: String(claimed.name ?? ''),
          meal: claimed.meal ? String(claimed.meal) : undefined,
          date: String(claimed.date ?? ''),
          time: String(claimed.time ?? ''),
          partySize: Number(claimed.partySize ?? 1),
          adults: optionalNumber(claimed.adults),
          children: optionalNumber(claimed.children),
          infants: optionalNumber(claimed.infants),
          subtotalCents: optionalNumber(claimed.subtotalCents),
          taxCents: optionalNumber(claimed.taxCents),
          feeCents: Number(claimed.feeCents ?? 0),
          occasion: claimed.occasion ? String(claimed.occasion) : undefined,
          specialRequests: claimed.specialRequests ? String(claimed.specialRequests) : undefined,
        },
        getResendMailConfig(),
      )
    } catch (error) {
      functions.logger.error('Failed to send reservation confirmation email', {
        reservationId,
        error: formatError(error),
      })
      await ref.update({ customerConfirmationSent: false, updatedAt: FieldValue.serverTimestamp() })
    }
  },
)
