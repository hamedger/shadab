import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { isFirestorePermissionDenied } from './firestoreErrors'

export interface UserProfileInput {
  email: string
  phone: string
  displayName: string
  isGuest?: boolean
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const PROFILE_FIELDS = (uid: string, profile: UserProfileInput) => ({
  uid,
  email: profile.email.trim(),
  phone: profile.phone.trim(),
  displayName: profile.displayName.trim(),
  photoURL: '',
  isGuest: profile.isGuest ?? false,
  addresses: [] as [],
  defaultAddressId: '',
  dietaryPreferences: [] as string[],
  pushToken: '',
  updatedAt: serverTimestamp(),
})

/** Best-effort Firestore write for auth flows (register / guest). */
export async function ensureUserProfile(uid: string, profile: UserProfileInput): Promise<boolean> {
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
      throw createError
    }
  } catch {
    return false
  }
}
