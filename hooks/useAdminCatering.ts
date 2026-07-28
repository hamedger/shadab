import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { handleFirestoreListenerError } from '../lib/firestoreErrors'
import { useAuthStore } from '../store/authStore'
import { CateringInquiry } from '../types/catering'

export function useAdminCatering(maxItems = 100) {
  const [inquiries, setInquiries] = useState<CateringInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const { firebaseUser, isAdmin } = useAuthStore()

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseUser || !isAdmin) {
      setInquiries([])
      setLoading(false)
      return
    }

    const q = query(collection(db, 'catering_inquiries'), orderBy('createdAt', 'desc'), limit(maxItems))

    const unsub = onSnapshot(
      q,
      (snap) => {
        setInquiries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CateringInquiry)))
        setLoading(false)
      },
      (error) => {
        handleFirestoreListenerError(error, 'admin catering listener')
        setInquiries([])
        setLoading(false)
      },
    )

    return unsub
  }, [maxItems, firebaseUser?.uid, isAdmin])

  return { inquiries, loading }
}
