import { User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { ensureUserProfile, UserProfileInput } from './userProfile'
import { getLoyaltyTier } from './services/loyaltyService'
import { User } from '../types/user'
import { useAuthStore } from '../store/authStore'

export function normalizeUserProfile(data: Partial<User> & { uid: string }): User {
  const points = typeof data.loyaltyPoints === 'number' ? data.loyaltyPoints : 0
  return {
    uid: data.uid,
    email: data.email?.trim() || '',
    phone: data.phone?.trim() || '',
    displayName: data.displayName?.trim() || '',
    photoURL: data.photoURL ?? '',
    isGuest: data.isGuest ?? false,
    addresses: data.addresses ?? [],
    defaultAddressId: data.defaultAddressId ?? '',
    loyaltyPoints: points,
    loyaltyTier: data.loyaltyTier ?? getLoyaltyTier(points),
    totalOrderCount: data.totalOrderCount ?? 0,
    totalSpend: data.totalSpend ?? 0,
    dietaryPreferences: data.dietaryPreferences ?? [],
    pushToken: data.pushToken ?? '',
    createdAt: (data.createdAt ?? null) as User['createdAt'],
    updatedAt: (data.updatedAt ?? null) as User['updatedAt'],
  }
}

export function buildFallbackProfile(uid: string, input: UserProfileInput): User {
  return normalizeUserProfile({
    uid,
    email: input.email.trim(),
    phone: input.phone.trim(),
    displayName: input.displayName.trim(),
    isGuest: input.isGuest ?? false,
  })
}

/** Ensure Firestore profile exists and sync Zustand after sign-in or register. */
export async function syncUserProfileAfterAuth(
  firebaseUser: FirebaseUser,
  input: Partial<UserProfileInput> & { isGuest?: boolean } = {},
): Promise<User> {
  const profileInput: UserProfileInput = {
    email: input.email?.trim() || firebaseUser.email?.trim() || '',
    phone: input.phone?.trim() || '',
    displayName: input.displayName?.trim() || firebaseUser.displayName?.trim() || '',
    isGuest: input.isGuest ?? false,
  }

  const fallback = buildFallbackProfile(firebaseUser.uid, profileInput)
  const saved = await ensureUserProfile(firebaseUser.uid, profileInput)

  let user = fallback
  if (saved) {
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (snap.exists()) {
      user = normalizeUserProfile({ uid: firebaseUser.uid, ...(snap.data() as Partial<User>) })
    }
  }

  if (input.isGuest === false && user.isGuest) {
    user = { ...user, isGuest: false }
  }

  useAuthStore.getState().setUserProfile(user)
  return user
}
