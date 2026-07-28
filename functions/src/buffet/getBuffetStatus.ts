import * as functions from 'firebase-functions/v2'
import * as admin from 'firebase-admin'

const db = admin.firestore()

export const getBuffetStatus = functions.https.onCall(async (request) => {
  const { data } = request
  const locationId = data?.locationId ?? 'chicago-il'

  const snap = await db.collection('buffet').doc(locationId).get()
  if (!snap.exists) {
    return { isOpen: false, currentPrice: 0, todaysDishes: [] }
  }

  return snap.data()
})
