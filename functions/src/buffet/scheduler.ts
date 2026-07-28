import * as functions from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'

const db = admin.firestore()
const LOCATION_ID = 'chicago-il'
const TIMEZONE = 'America/Chicago'

function isSunday(): boolean {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }))
  return now.getDay() === 0
}

// 11:00 AM Detroit — open lunch (Mon–Sat)
export const openLunch = functions.onSchedule(
  { schedule: '0 11 * * 1-6', timeZone: TIMEZONE },
  async () => {
    await db.collection('buffet').doc(LOCATION_ID).update({ isLunchActive: true })
  },
)

// 3:00 PM Detroit — close lunch
export const closeLunch = functions.onSchedule(
  { schedule: '0 15 * * 1-6', timeZone: TIMEZONE },
  async () => {
    await db.collection('buffet').doc(LOCATION_ID).update({ isLunchActive: false })
  },
)

// 5:00 PM Detroit — open dinner (Mon–Sat)
export const openDinner = functions.onSchedule(
  { schedule: '0 17 * * 1-6', timeZone: TIMEZONE },
  async () => {
    if (isSunday()) return
    await db.collection('buffet').doc(LOCATION_ID).update({ isDinnerActive: true })
  },
)

// 9:00 PM Detroit — close dinner
export const closeDinner = functions.onSchedule(
  { schedule: '0 21 * * 1-6', timeZone: TIMEZONE },
  async () => {
    await db.collection('buffet').doc(LOCATION_ID).update({ isDinnerActive: false })
  },
)
