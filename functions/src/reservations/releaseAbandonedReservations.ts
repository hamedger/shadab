import * as functions from 'firebase-functions/v2'
import * as scheduler from 'firebase-functions/v2/scheduler'
import { db, FieldValue } from '../db'

/** Unpaid checkouts older than this give their seats back to the 90-minute block. */
const ABANDONED_AFTER_MINUTES = 30

/**
 * Cancels reservations still `pending` (no Clover payment) well after checkout started, so a
 * guest who closes the Clover page doesn't hold seats in a 100-guest block forever.
 * If Clover's webhook later reports a payment for one of these, the server reinstates it when
 * seats allow, or flags it for staff to refund (see server/src/services/reservationService.ts).
 */
export const releaseAbandonedReservations = scheduler.onSchedule(
  { schedule: 'every 10 minutes', timeZone: 'America/Chicago' },
  async () => {
    const cutoffMs = Date.now() - ABANDONED_AFTER_MINUTES * 60_000
    // Equality-only query (no composite index); pending reservations are few.
    const snap = await db.collection('reservations').where('status', '==', 'pending').get()

    let released = 0
    for (const doc of snap.docs) {
      const createdAt = doc.get('createdAt') as FirebaseFirestore.Timestamp | undefined
      if (!createdAt || createdAt.toMillis() > cutoffMs) continue

      const didRelease = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(doc.ref)
        const data = fresh.data()
        if (!data || data.status !== 'pending' || String(data.cloverPaymentId ?? '').trim()) return false

        const blockId = String(data.capacityBlockId ?? '')
        const partySize = Number(data.partySize ?? 0)
        if (blockId && partySize) {
          tx.set(
            db.collection('reservationCapacity').doc(blockId),
            { guests: FieldValue.increment(-partySize) },
            { merge: true },
          )
        }
        tx.update(doc.ref, {
          status: 'cancelled',
          cancelReason: 'checkout_abandoned',
          updatedAt: FieldValue.serverTimestamp(),
        })
        return true
      })
      if (didRelease) released++
    }

    if (released > 0) {
      functions.logger.info('Released abandoned reservation checkouts', { released })
    }
  },
)
