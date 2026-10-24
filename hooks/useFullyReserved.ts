import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { handleFirestoreListenerError } from '../lib/firestoreErrors'
import { getCurrentServiceDate } from '../lib/admin/reservationAdmin'

/**
 * Live "fully reserved today" switch (`settings/reservations`). Staff turn it on in admin; it holds
 * the service date it was set on, so it switches itself off when that service day ends (3:00 AM).
 */
export function useFullyReserved() {
  const [fullyReservedDate, setFullyReservedDate] = useState('')

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return onSnapshot(
      doc(db, 'settings', 'reservations'),
      (snap) => setFullyReservedDate(String(snap.data()?.fullyReservedDate ?? '')),
      (error) => {
        handleFirestoreListenerError(error, 'reservation settings listener')
        setFullyReservedDate('')
      },
    )
  }, [])

  const fullyReservedToday = fullyReservedDate !== '' && fullyReservedDate === getCurrentServiceDate()
  return { fullyReservedToday, fullyReservedDate: fullyReservedToday ? fullyReservedDate : '' }
}
