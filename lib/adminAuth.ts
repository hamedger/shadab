import {
  signInWithEmailAndPassword,
  signOut,
  getIdTokenResult,
  User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'

/** Emails allowed full admin access. */
const ADMIN_EMAILS = new Set(
  [
    process.env.EXPO_PUBLIC_ADMIN_EMAIL,
    'deccanbawarchi7@gmail.com',
  ]
    .filter(Boolean)
    .map((e) => e!.toLowerCase()),
)

export const DEFAULT_ADMIN_EMAIL =
  process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? ''

const SKIP_CLAIM_CHECK = process.env.EXPO_PUBLIC_ADMIN_SKIP_CLAIM === 'true'

export function isAdminUser(user: User | null, claims: Record<string, unknown>): boolean {
  if (!user) return false
  if (SKIP_CLAIM_CHECK) return true
  if (claims.admin) return true
  const email = user.email?.toLowerCase()
  return !!email && ADMIN_EMAILS.has(email)
}

export async function signInWithAdminCredentials(email: string, password: string): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured')
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !password) {
    throw new Error('Enter your admin email and password.')
  }

  const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password)
  await cred.user.getIdToken(true)
  const token = await getIdTokenResult(cred.user)

  if (!isAdminUser(cred.user, token.claims)) {
    await signOut(auth)
    throw new Error(
      `Account "${cred.user.email}" is not authorized. Allowed admin emails: ${[...ADMIN_EMAILS].join(', ')}`,
    )
  }

  return cred.user
}

export async function signOutAdmin(): Promise<void> {
  if (!auth) return
  await signOut(auth)
}
