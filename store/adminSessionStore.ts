import { create } from 'zustand'
import { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { adminAuth } from '../lib/firebaseAdmin'

interface AdminSessionState {
  adminUser: User | null
  isAdminReady: boolean
  isAdminSignedIn: boolean
  setAdminUser: (user: User | null) => void
}

export const useAdminSessionStore = create<AdminSessionState>((set) => ({
  adminUser: null,
  isAdminReady: false,
  isAdminSignedIn: false,
  setAdminUser: (user) => set({ adminUser: user, isAdminSignedIn: !!user }),
}))

let unsubscribe: (() => void) | null = null

/** Subscribe once to the separate admin Firebase auth session. */
export function initAdminSessionListener(): () => void {
  if (unsubscribe) return unsubscribe

  if (!adminAuth) {
    useAdminSessionStore.setState({ isAdminReady: true })
    return () => {}
  }

  unsubscribe = onAuthStateChanged(adminAuth, (user) => {
    useAdminSessionStore.setState({
      adminUser: user,
      isAdminSignedIn: !!user,
      isAdminReady: true,
    })
  })

  return unsubscribe
}
