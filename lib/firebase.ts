import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  Firestore,
} from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { Platform } from 'react-native'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

export { firebaseConfig }

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
)

// Use a demo project ID when unconfigured so the app renders without crashing
const safeConfig = isFirebaseConfigured
  ? firebaseConfig
  : { ...firebaseConfig, apiKey: 'demo-key', projectId: 'demo-project', appId: '1:000:web:000' }

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(safeConfig) : getApps()[0]

function createAuth(firebaseApp: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    try {
      return initializeAuth(firebaseApp, { persistence: browserLocalPersistence })
    } catch {
      return getAuth(firebaseApp)
    }
  }
  return getAuth(firebaseApp)
}

function createFirestore(firebaseApp: FirebaseApp): Firestore {
  if (Platform.OS === 'web' && isFirebaseConfigured) {
    try {
      return initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
      })
    } catch {
      return getFirestore(firebaseApp)
    }
  }
  return getFirestore(firebaseApp)
}

export const auth: Auth = createAuth(app)

const useAuthEmulator =
  process.env.EXPO_PUBLIC_USE_AUTH_EMULATOR === 'true' ||
  process.env.EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR === 'true'

if (useAuthEmulator && isFirebaseConfigured) {
  const host = process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST ?? '127.0.0.1'
  const port = Number(process.env.EXPO_PUBLIC_AUTH_EMULATOR_PORT ?? 9099)
  try {
    connectAuthEmulator(auth, `http://${host}:${port}`, { disableWarnings: true })
  } catch {
    // emulator already connected (hot reload)
  }
}

export const db: Firestore = createFirestore(app)

if (process.env.EXPO_PUBLIC_USE_FIRESTORE_EMULATOR === 'true' && isFirebaseConfigured) {
  const host = process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST ?? '127.0.0.1'
  const port = Number(process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT ?? 8080)
  try {
    connectFirestoreEmulator(db, host, port)
  } catch {
    // emulator already connected (hot reload)
  }
}

export const storage: FirebaseStorage = getStorage(app)

// Offline persistence (native only)
if (Platform.OS !== 'web' && isFirebaseConfigured) {
  import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(db).catch(() => {})
  })
}

export default app
