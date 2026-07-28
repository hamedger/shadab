import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser)
  const userProfile = useAuthStore((s) => s.userProfile)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAdmin = useAuthStore((s) => s.isAdmin)

  return {
    firebaseUser,
    userProfile,
    isLoading,
    isAdmin,
    isAuthenticated: !!firebaseUser,
  }
}
