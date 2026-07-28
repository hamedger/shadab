import { useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { handleFirestoreListenerError } from '../lib/firestoreErrors'
import { useAuthStore } from '../store/authStore'
import { useOrderStore } from '../store/orderStore'
import { isOrderActive } from '../lib/admin/orderAdmin'
import { Order } from '../types/order'

export function useOrders() {
  const { firebaseUser } = useAuthStore()
  const { setOrderHistory, setActiveOrder } = useOrderStore()

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseUser) return
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', firebaseUser.uid),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
        setOrderHistory(orders)
        const active = orders.find((o) => isOrderActive(o))
        setActiveOrder(active ?? null)
      },
      (error) => {
        handleFirestoreListenerError(error, 'orders listener')
        setOrderHistory([])
        setActiveOrder(null)
      },
    )
    return unsub
  }, [firebaseUser?.uid])
}

export function useOrder(orderId: string) {
  const { setActiveOrder } = useOrderStore()

  useEffect(() => {
    if (!isFirebaseConfigured || !orderId) return
    const unsub = onSnapshot(
      doc(db, 'orders', orderId),
      (snap) => {
        if (snap.exists()) setActiveOrder({ id: snap.id, ...snap.data() } as Order)
      },
      (error) => handleFirestoreListenerError(error, 'order listener'),
    )
    return unsub
  }, [orderId])
}
