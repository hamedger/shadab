import { useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSelectedLocation } from './useSelectedLocation'
import { validateReservation, ReservationInput } from '../lib/services/reservationService'
import {
  createPayAtRestaurantReservation,
  PayAtRestaurantReservation,
  startReservationCheckout,
} from '../lib/services/reservationCheckout'
import { RESERVATION_PREPAYMENT_ENABLED } from '../constants/reservation'
import { DEFAULT_LOCATION_ID } from '../constants/config'
import { redirectToCloverCheckout } from '../lib/services/cloverCheckout'
import { auth } from '../lib/firebase'
import type { BuffetMeal } from '../constants/buffetSchedule'
import { signInForGuestCheckout } from '../lib/guestAuth'
import { ensureGuestProfile } from '../lib/guestProfile'

export function useReservation() {
  const { firebaseUser, userProfile } = useAuthStore()
  const { locationId } = useSelectedLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Set once a pay-at-restaurant booking is saved; the screen shows the confirmation. */
  const [booked, setBooked] = useState<PayAtRestaurantReservation | null>(null)

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
          const cred = await signInForGuestCheckout(payload.name, payload.email ?? '')
          await ensureGuestProfile(cred.user.uid, {
            email: payload.email ?? '',
            phone: payload.phone,
            displayName: payload.name,
          })
        }

        if (!RESERVATION_PREPAYMENT_ENABLED) {
          const uid = auth.currentUser?.uid
          if (!uid) throw new Error('Could not start your reservation — please try again.')
          const reservation = await createPayAtRestaurantReservation({
            ...payload,
            userId: uid,
            meal: payload.meal as BuffetMeal,
            locationId: locationId || payload.locationId || DEFAULT_LOCATION_ID,
          })
          setBooked(reservation)
          return
        }

        const { href } = await startReservationCheckout({
          meal: payload.meal as BuffetMeal,
          adults: payload.adults,
          children: payload.children,
          infants: payload.infants,
          date: payload.date,
          time: payload.time,
          occasion: payload.occasion,
          specialRequests: payload.specialRequests,
          locationId: locationId ?? payload.locationId ?? '',
          customerName: payload.name,
          customerPhone: payload.phone,
          customerEmail: payload.email ?? '',
        })
        redirectToCloverCheckout(href)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to book your reservation'
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

  return { submit, loading, error, booked, defaultName, defaultEmail, defaultPhone }
}
