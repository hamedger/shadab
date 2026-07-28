import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import { ReservationStatus } from '../../types/reservation'

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured')

  await updateDoc(doc(db, 'reservations', id), {
    status,
    updatedAt: serverTimestamp(),
  })
}
