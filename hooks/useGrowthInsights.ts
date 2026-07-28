import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { handleFirestoreListenerError } from '../lib/firestoreErrors'
import { GROWTH_INSIGHTS_LOCATION } from '../lib/admin/growthMetrics'
import { useAuthStore } from '../store/authStore'
import { GrowthInsightsDoc } from '../types/insights'

export function useGrowthInsights(locationId = GROWTH_INSIGHTS_LOCATION) {
  const [insights, setInsights] = useState<GrowthInsightsDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const { firebaseUser, isAdmin } = useAuthStore()

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseUser || !isAdmin) {
      setInsights(null)
      setLoading(false)
      return
    }

    const ref = doc(db, 'admin_insights', locationId)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setInsights(snap.exists() ? (snap.data() as GrowthInsightsDoc) : null)
        setLoading(false)
      },
      (error) => {
        handleFirestoreListenerError(error, 'growth insights listener')
        setInsights(null)
        setLoading(false)
      },
    )

    return unsub
  }, [firebaseUser?.uid, isAdmin, locationId])

  return { insights, loading }
}
