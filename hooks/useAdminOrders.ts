import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { handleFirestoreListenerError } from '../lib/firestoreErrors'
import { locationIdsForFirestoreQuery } from '../lib/locationUtils'
import { OrderCustomerProfile } from '../lib/admin/orderAdmin'
import { useAuthStore } from '../store/authStore'
import { Order } from '../types/order'

export function useAdminOrders(maxOrders = 150, locationId?: string | null) {
  const [orders, setOrders] = useState<Order[]>([])
  const [customerProfiles, setCustomerProfiles] = useState<Map<string, OrderCustomerProfile>>(
    new Map(),
  )
  const [loading, setLoading] = useState(true)
  const { firebaseUser, isAdmin } = useAuthStore()

  const userIdsKey = useMemo(() => {
    const ids = [
      ...new Set(
        orders
          .map((o) => o.userId)
          .filter((id): id is string => Boolean(id) && id !== 'guest'),
      ),
    ].sort()
    return ids.join(',')
  }, [orders])

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseUser || !isAdmin) {
      setOrders([])
      setLoading(false)
      return
    }

    const base = collection(db, 'orders')
    const q = locationId
      ? query(
          base,
          where('locationId', 'in', locationIdsForFirestoreQuery(locationId)),
          orderBy('createdAt', 'desc'),
          limit(maxOrders),
        )
      : query(base, orderBy('createdAt', 'desc'), limit(maxOrders))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)))
        setLoading(false)
      },
      (error) => {
        handleFirestoreListenerError(error, 'admin orders listener')
        setOrders([])
        setLoading(false)
      },
    )

    return unsub
  }, [maxOrders, locationId, firebaseUser?.uid, isAdmin])

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseUser || !isAdmin || !userIdsKey) {
      setCustomerProfiles(new Map())
      return
    }

    let cancelled = false
    const userIds = userIdsKey.split(',').filter(Boolean)

    void (async () => {
      const entries = await Promise.all(
        userIds.map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid))
          if (!snap.exists()) return null
          const data = snap.data()
          return [
            uid,
            {
              displayName: String(data.displayName ?? '').trim(),
              phone: String(data.phone ?? '').trim(),
            },
          ] as const
        }),
      )

      if (cancelled) return
      setCustomerProfiles(new Map(entries.filter((entry): entry is [string, OrderCustomerProfile] => entry !== null)))
    })()

    return () => {
      cancelled = true
    }
  }, [userIdsKey, firebaseUser?.uid, isAdmin])

  return { orders, customerProfiles, loading }
}
