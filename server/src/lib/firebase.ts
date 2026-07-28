import '../env'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getFirebaseProjectId } from '../env'

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const projectId = getFirebaseProjectId()
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()

  if (json) {
    const serviceAccount = JSON.parse(json)
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id ?? projectId,
    })
  }

  if (projectId) {
    return initializeApp({ projectId })
  }

  return initializeApp()
}

initFirebaseAdmin()

export const db = getFirestore()
export const auth = getAuth()
