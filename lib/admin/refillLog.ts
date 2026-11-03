import { DocumentReference, Timestamp, WriteBatch, collection, doc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { BuffetDish } from '../../types/buffet'
import { getRefillMealContext } from './refillAnalytics'

export const BUFFET_REFILLS_COLLECTION = 'buffetRefills'

function currentStaff(): string | null {
  return auth.currentUser?.email ?? auth.currentUser?.uid ?? null
}

/**
 * Floor staff flagged a dish (dot → red): open a refill record.
 * Returns the dish fields to merge into `todaysDishes`.
 */
export function logRefillRequested(
  batch: WriteBatch,
  locationId: string,
  dish: BuffetDish,
  nowMs: number = Date.now(),
): Partial<BuffetDish> {
  const ref = doc(collection(db, BUFFET_REFILLS_COLLECTION))
  const { meal, hour } = getRefillMealContext(new Date(nowMs))
  batch.set(ref, {
    locationId,
    menuItemId: dish.menuItemId,
    dishName: dish.name,
    status: 'open',
    requestedAt: Timestamp.fromMillis(nowMs),
    completedAt: null,
    durationSeconds: null,
    meal,
    hour,
    requestedBy: currentStaff(),
    completedBy: null,
  })
  return { needsRefill: true, refillRequestedAt: nowMs, refillEventId: ref.id }
}

/**
 * Dish restocked (dot → green) or removed from the line while waiting: close the open record.
 * Dishes flagged before refill logging existed have no record, so nothing is written for them.
 */
export function logRefillClosed(
  batch: WriteBatch,
  dish: BuffetDish,
  status: 'completed' | 'cancelled',
  nowMs: number = Date.now(),
): Partial<BuffetDish> {
  if (dish.refillEventId) {
    const ref: DocumentReference = doc(db, BUFFET_REFILLS_COLLECTION, dish.refillEventId)
    const durationSeconds =
      status === 'completed' && dish.refillRequestedAt
        ? Math.max(0, Math.round((nowMs - dish.refillRequestedAt) / 1000))
        : null
    batch.update(ref, {
      status,
      completedAt: Timestamp.fromMillis(nowMs),
      durationSeconds,
      completedBy: currentStaff(),
    })
  }
  return { needsRefill: false, refillRequestedAt: null, refillEventId: null }
}
