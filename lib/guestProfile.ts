import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { isFirestorePermissionDenied } from './firestoreErrors'

export interface GuestProfileInput {
  email: string
  phone: string
  displayName: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const PROFILE_FIELDS = (uid: string, profile: GuestProfileInput) => ({
  uid,
  email: profile.email.trim(),
  phone: profile.phone.trim(),
  displayName: profile.displayName.trim(),
  photoURL: '',
  isGuest: true,
  addresses: [] as [],
  defaultAddressId: '',
  dietaryPreferences: [] as string[],
  pushToken: '',
  updatedAt: serverTimestamp(),
})

/** Best-effort Firestore write — checkout can proceed with in-memory profile if this fails. */
export async function ensureGuestProfile(uid: string, profile: GuestProfileInput): Promise<boolean> {
  const ref = doc(db, 'users', uid)
  const fields = PROFILE_FIELDS(uid, profile)

  try {
    const snap = await getDoc(ref)
    if (snap.exists()) {
      await updateDoc(ref, fields)
      return true
    }

    try {
      await setDoc(ref, fields)
      return true
    } catch (createError) {
      if (!isFirestorePermissionDenied(createError)) {
        for (let i = 0; i < 5; i++) {
          await sleep(400)
          const retry = await getDoc(ref)
          if (retry.exists()) {
            await updateDoc(ref, fields)
            return true
          }
        }
      }
    }
  } catch {
    return false
  }

  return false
}

export function isGuestProfileWriteError(error: unknown): boolean {
  return isFirestorePermissionDenied(error)
}
