import { useEffect, useState } from 'react'
import { collection, documentId, onSnapshot, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { handleFirestoreListenerError } from '../lib/firestoreErrors'
import type { BuffetMeal } from '../constants/buffetSchedule'

/** Live guests booked per 90-minute block (keyed by block id) for one date and meal. */
export function useReservationCapacity(date: string, meal: BuffetMeal | '') {
  const [bookedByBlock, setBookedByBlock] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!isFirebaseConfigured || !date || !meal) {
      setBookedByBlock({})
      return
    }

    const prefix = `${date}_${meal}_`
    const q = query(
      collection(db, 'reservationCapacity'),
      where(documentId(), '>=', prefix),
      where(documentId(), '<', `${prefix}`),
    )

    return onSnapshot(
      q,
      (snap) => {
        const next: Record<string, number> = {}
        snap.docs.forEach((d) => {
          next[d.id] = Number(d.data().guests ?? 0)
        })
        setBookedByBlock(next)
      },
      (error) => {
        handleFirestoreListenerError(error, 'reservation capacity listener')
        setBookedByBlock({})
      },
    )
  }, [date, meal])

  return bookedByBlock
}
