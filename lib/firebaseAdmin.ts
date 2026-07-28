import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured } from './firebase'

const ADMIN_APP_NAME = 'deccan-admin'

function getAdminApp(): FirebaseApp {
  const existing = getApps().find((a) => a.name === ADMIN_APP_NAME)
  if (existing) return existing
  return initializeApp(firebaseConfig, ADMIN_APP_NAME)
}

export const adminApp = isFirebaseConfigured ? getAdminApp() : null
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null
export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null

/** Firestore instance for admin writes — falls back to main db if admin app unavailable. */
export function getAdminDb(): Firestore {
  if (adminDb) return adminDb
  throw new Error('Admin Firebase is not configured')
}
