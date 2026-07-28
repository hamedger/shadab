import { create } from 'zustand'
import { User as FirebaseUser } from 'firebase/auth'
import { User } from '../types/user'

interface AuthState {
  firebaseUser: FirebaseUser | null
  userProfile: User | null
  isLoading: boolean
  isAdmin: boolean

  setFirebaseUser: (user: FirebaseUser | null) => void
  setUserProfile: (profile: User | null) => void
  setLoading: (loading: boolean) => void
  setAdmin: (isAdmin: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  userProfile: null,
  isLoading: true,
  isAdmin: false,

  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoading: (loading) => set({ isLoading: loading }),
  setAdmin: (isAdmin) => set({ isAdmin }),
}))
