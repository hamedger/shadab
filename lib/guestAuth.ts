import { FirebaseError } from 'firebase/app'
import {
  UserCredential,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'

function generateGuestPassword(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${crypto.randomUUID()}Aa1!`
  }
  return `${Date.now().toString(36)}GuestAa1!`
}

function isAnonymousDisabled(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    (error.code === 'auth/admin-restricted-operation' ||
      error.code === 'auth/operation-not-allowed')
  )
}

async function createGuestEmailAccount(email: string, displayName: string): Promise<UserCredential> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, generateGuestPassword())
    await updateProfile(cred.user, { displayName })
    return cred
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
      throw new Error(
        'An account with this email already exists. Sign in to continue checkout, or use a different email.',
      )
    }
    throw error
  }
}

/** Sign in for guest checkout — anonymous when enabled, otherwise a one-time email account. */
export async function signInForGuestCheckout(
  displayName: string,
  email: string,
): Promise<UserCredential> {
  const trimmedEmail = email.trim()
  const trimmedName = displayName.trim()

  try {
    const cred = await signInAnonymously(auth)
    if (trimmedName) {
      await updateProfile(cred.user, { displayName: trimmedName })
    }
    return cred
  } catch (error) {
    if (!isAnonymousDisabled(error)) {
      throw error
    }
    return createGuestEmailAccount(trimmedEmail, trimmedName)
  }
}
