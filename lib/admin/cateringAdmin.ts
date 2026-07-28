import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import { CateringStatus } from '../../types/catering'

export const CATERING_STATUS_LABELS: Record<CateringStatus, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  confirmed: 'Confirmed',
  declined: 'Declined',
}

export async function updateCateringStatus(id: string, status: CateringStatus) {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured')

  await updateDoc(doc(db, 'catering_inquiries', id), {
    status,
    updatedAt: serverTimestamp(),
  })
}
