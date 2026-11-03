import * as functions from 'firebase-functions/v2'
import { db } from '../db'

export const confirmCloverReservation = functions.https.onCall(
  { invoker: 'public' },
  async (request) => {
    const { auth, data } = request
    if (!auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
    }

    const reservationIdInput = String(data?.reservationId ?? '').trim()
    const checkoutSessionId = String(data?.checkoutSessionId ?? '').trim()

    if (!checkoutSessionId) {
      throw new functions.https.HttpsError('invalid-argument', 'checkoutSessionId is required')
    }

    let reservationId = reservationIdInput
    if (!reservationId) {
      const sessionSnap = await db
        .collection('reservations')
        .where('cloverCheckoutSessionId', '==', checkoutSessionId)
        .limit(1)
        .get()
      if (sessionSnap.empty) {
        throw new functions.https.HttpsError('not-found', 'Reservation not found for checkout session')
      }
      const sessionReservation = sessionSnap.docs[0]
      if (sessionReservation.data().userId !== auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not your reservation')
      }
      reservationId = sessionSnap.docs[0].id
    }

    const reservationRef = db.collection('reservations').doc(reservationId)

    const result = await (async () => {
      const snap = await reservationRef.get()
      if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'Reservation not found')
      }

      const reservation = snap.data()!
      if (reservation.userId !== auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not your reservation')
      }

      const storedSessionId = String(reservation.cloverCheckoutSessionId ?? '').trim()
      if (!storedSessionId || storedSessionId !== checkoutSessionId) {
        throw new functions.https.HttpsError('failed-precondition', 'Checkout session mismatch')
      }

      const status = String(reservation.status ?? '')
      const summary = {
        reservationId,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        feeCents: reservation.feeCents ?? 0,
      }

      // Read-only: only Clover's signed webhook (server/) marks a reservation paid. Returning from
      // Clover proves nothing — the session id is known to the browser before payment.
      if (status === 'pending') {
        return { ...summary, status: 'pending' as const }
      }

      if (status === 'confirmed') {
        return { ...summary, status: 'confirmed' as const }
      }

      throw new functions.https.HttpsError('failed-precondition', `Reservation is ${status}`)
    })()

    functions.logger.info('Clover reservation status checked after checkout redirect', {
      reservationId: result.reservationId,
      checkoutSessionId,
      uid: auth.uid,
    })

    return result
  },
)
