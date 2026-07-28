import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { handleFirestoreListenerError } from '../lib/firestoreErrors'
import { BuffetConfig, BuffetStatus } from '../types/buffet'
import { RESTAURANT_TIMEZONE } from '../constants/buffet'
import { DEFAULT_LOCATION_ID } from '../constants/config'
import { computeBuffetStatus } from '../lib/services/buffetService'

export function useBuffet(locationId: string = DEFAULT_LOCATION_ID): BuffetStatus {
  const [config, setConfig] = useState<BuffetConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false)
      return
    }
    const unsub = onSnapshot(
      doc(db, 'buffet', locationId),
      (snap) => {
        if (snap.exists()) setConfig(snap.data() as BuffetConfig)
        setIsLoading(false)
      },
      (error) => {
        handleFirestoreListenerError(error, 'buffet listener')
        setIsLoading(false)
      },
    )
    return unsub
  }, [locationId])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const status = computeBuffetStatus({
    config,
    now,
    timezone: RESTAURANT_TIMEZONE,
  })

  return { ...status, isLoading }
}
