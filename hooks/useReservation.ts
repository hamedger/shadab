import { useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSelectedLocation } from './useSelectedLocation'
import { validateReservation, ReservationInput } from '../lib/services/reservationService'
import { startReservationCheckout } from '../lib/services/reservationCheckout'
import { redirectToCloverCheckout } from '../lib/services/cloverCheckout'
import { auth } from '../lib/firebase'
import { signInForGuestCheckout } from '../lib/guestAuth'
import { ensureGuestProfile } from '../lib/guestProfile'

export function useReservation() {
  const { firebaseUser, userProfile } = useAuthStore()
  const { locationId } = useSelectedLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(
    async (input: Omit<ReservationInput, 'userId'>) => {
      setError(null)
      const payload: ReservationInput = {
        ...input,
        userId: firebaseUser?.uid ?? 'guest',
      }

      const validation = validateReservation(payload)
      if (!validation.valid) {
        setError(validation.errors[0])
        throw new Error(validation.errors[0])
      }

      setLoading(true)
      try {
        // Reservations don't require creating an account — sign in anonymously behind
        // the scenes if the visitor isn't already authenticated.
        if (!auth.currentUser) {
          const cred = await signInForGuestCheckout(payload.name, payload.email)
          await ensureGuestProfile(cred.user.uid, {
            email: payload.email,
            phone: payload.phone,
            displayName: payload.name,
          })
        }

        const { href } = await startReservationCheckout({
          partySize: payload.partySize,
          date: payload.date,
          time: payload.time,
          occasion: payload.occasion,
          specialRequests: payload.specialRequests,
          locationId: locationId ?? payload.locationId ?? '',
          customerName: payload.name,
          customerPhone: payload.phone,
          customerEmail: payload.email,
        })
        redirectToCloverCheckout(href)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to start reservation checkout'
        setError(message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [firebaseUser, locationId],
  )

  const defaultName = userProfile?.displayName ?? ''
  const defaultEmail = userProfile?.email ?? firebaseUser?.email ?? ''
  const defaultPhone = userProfile?.phone ?? ''

  return { submit, loading, error, defaultName, defaultEmail, defaultPhone }
}
