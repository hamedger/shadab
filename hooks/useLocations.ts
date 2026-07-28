import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { handleFirestoreListenerError } from '../lib/firestoreErrors'
import { STATIC_LOCATIONS } from '../constants/staticLocations'
import { Location } from '../types/location'
import { isLocationActive, mergePickableLocations, mergeAllLocations } from '../lib/locationUtils'

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>(STATIC_LOCATIONS)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLocations(STATIC_LOCATIONS.filter(isLocationActive))
      setLoading(false)
      return
    }

    const q = query(collection(db, 'locations'), where('isActive', '==', true))
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setLocations(STATIC_LOCATIONS.filter(isLocationActive))
        } else {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Location))
          setLocations(mergePickableLocations(docs))
        }
        setLoading(false)
      },
      (error) => {
        handleFirestoreListenerError(error, 'locations listener')
        setLocations(STATIC_LOCATIONS.filter(isLocationActive))
        setLoading(false)
      },
    )

    return unsub
  }, [])

  return { locations, loading }
}

export function useAllLocations() {
  const [locations, setLocations] = useState<Location[]>(STATIC_LOCATIONS)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLocations(STATIC_LOCATIONS)
      setLoading(false)
      return
    }

    const unsub = onSnapshot(
      collection(db, 'locations'),
      (snap) => {
        if (snap.empty) {
          setLocations(STATIC_LOCATIONS)
        } else {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Location))
          setLocations(mergeAllLocations(docs))
        }
        setLoading(false)
      },
      (error) => {
        handleFirestoreListenerError(error, 'all locations listener')
        setLocations(STATIC_LOCATIONS)
        setLoading(false)
      },
    )

    return unsub
  }, [])

  return { locations, loading }
}
