/**
 * Rebuilds the per-block guest counters (`reservationCapacity`) from today's and upcoming
 * reservations, and stamps each one with its `capacityBlockId`. Run once after deploying the
 * 100-guests-per-90-minutes cap so bookings made before it count; safe to re-run.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   npm run backfill:reservation-capacity
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { FieldPath, getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import * as dotenv from 'dotenv'
import {
  BuffetMeal,
  getReservationBlockId,
  getRestaurantNow,
  RESERVATION_BLOCK_CAPACITY,
} from '../constants/buffetSchedule'

dotenv.config()

const projectId =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  'shadab-5c64e'

if (!getApps().length) {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (credPath) {
    const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'))
    initializeApp({ credential: cert(serviceAccount), projectId })
  } else {
    initializeApp({ projectId })
  }
}

const db = getFirestore()

async function main() {
  const today = getRestaurantNow().dateString
  const snap = await db.collection('reservations').where('date', '>=', today).get()

  const guestsByBlock = new Map<string, number>()
  const writer = db.bulkWriter()

  for (const doc of snap.docs) {
    const r = doc.data()
    const blockId = getReservationBlockId(r.date, (r.meal ?? 'dinner') as BuffetMeal, r.time ?? '')
    if (!blockId) {
      console.warn(`Skipping ${doc.id}: no seating block for ${r.date} ${r.time}`)
      continue
    }
    if (r.capacityBlockId !== blockId) writer.update(doc.ref, { capacityBlockId: blockId })
    if (r.status === 'cancelled') continue
    guestsByBlock.set(blockId, (guestsByBlock.get(blockId) ?? 0) + Number(r.partySize ?? 0))
  }

  // Blocks from today on: reset any counter with no live bookings left, then write the totals.
  const existing = await db.collection('reservationCapacity').where(FieldPath.documentId(), '>=', today).get()
  for (const doc of existing.docs) {
    if (!guestsByBlock.has(doc.id)) writer.set(doc.ref, { guests: 0 }, { merge: true })
  }
  for (const [blockId, guests] of [...guestsByBlock].sort()) {
    writer.set(db.collection('reservationCapacity').doc(blockId), { guests }, { merge: true })
    const over = guests > RESERVATION_BLOCK_CAPACITY ? `  (over ${RESERVATION_BLOCK_CAPACITY})` : ''
    console.log(`${blockId}: ${guests} guests${over}`)
  }

  await writer.close()
  console.log(`Done — ${snap.size} reservations, ${guestsByBlock.size} blocks with bookings.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
