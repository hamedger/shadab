import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { handleFirestoreListenerError } from '../lib/firestoreErrors'
import { locationIdsForFirestoreQuery } from '../lib/locationUtils'
import { useAuthStore } from '../store/authStore'
import { Reservation } from '../types/reservation'

export function useAdminReservations(maxItems = 100, locationId?: string | null) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const { firebaseUser, isAdmin } = useAuthStore()

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseUser || !isAdmin) {
      setReservations([])
      setLoading(false)
      return
    }

    const base = collection(db, 'reservations')
    const q = locationId
      ? query(
          base,
          where('locationId', 'in', locationIdsForFirestoreQuery(locationId)),
          orderBy('createdAt', 'desc'),
          limit(maxItems),
        )
      : query(base, orderBy('createdAt', 'desc'), limit(maxItems))

    const unsub = onSnapshot(
      q,
      (snap) => {
        setReservations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation)))
        setLoading(false)
      },
      (error) => {
        handleFirestoreListenerError(error, 'admin reservations listener')
        setReservations([])
        setLoading(false)
      },
    )

    return unsub
  }, [maxItems, locationId, firebaseUser?.uid, isAdmin])

  return { reservations, loading }
}
