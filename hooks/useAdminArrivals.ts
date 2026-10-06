import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { handleFirestoreListenerError } from '../lib/firestoreErrors'
import { locationIdsForFirestoreQuery } from '../lib/locationUtils'
import { useAuthStore } from '../store/authStore'
import { Reservation } from '../types/reservation'

/** Live reservations for one service date (YYYY-MM-DD), optionally limited to a location. */
export function useAdminArrivals(date: string, locationId?: string | null) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const { firebaseUser, isAdmin } = useAuthStore()

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseUser || !isAdmin) {
      setReservations([])
      setLoading(false)
      return
    }

    setLoading(true)
    // Single equality filter — no composite index needed; location is filtered client-side.
    const q = query(collection(db, 'reservations'), where('date', '==', date))
    const allowedLocations = locationId ? new Set(locationIdsForFirestoreQuery(locationId)) : null

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Reservation))
          .filter((r) => !allowedLocations || allowedLocations.has(r.locationId))
        setReservations(rows)
        setLoading(false)
      },
      (error) => {
        handleFirestoreListenerError(error, 'admin arrivals listener')
        setReservations([])
        setLoading(false)
      },
    )

    return unsub
  }, [date, locationId, firebaseUser?.uid, isAdmin])

  return { reservations, loading }
}
