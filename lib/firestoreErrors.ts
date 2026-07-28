import type { FirestoreError } from 'firebase/firestore'

export function isFirestorePermissionDenied(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as FirestoreError).code === 'permission-denied'
  )
}

export function getFirestoreErrorMessage(error: unknown): string {
  if (isFirestorePermissionDenied(error)) {
    return 'Could not save your profile. Please try again or sign in with your email.'
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Something went wrong saving your profile. Please try again.'
}

/** Log Firestore listener errors without throwing; permission issues are expected until rules deploy. */
export function handleFirestoreListenerError(error: unknown, context: string): void {
  if (isFirestorePermissionDenied(error)) {
    if (__DEV__) {
      console.warn(
        `[Firestore] ${context}: permission denied — deploy rules with \`firebase deploy --only firestore:rules\``,
      )
    }
    return
  }
  console.error(`[Firestore] ${context}:`, error)
}
