import { Platform } from 'react-native'
import { useAdminReservationAlerts } from '../../hooks/useAdminReservationAlerts'

/** Plays a chime and browser notification when a new table reservation comes in. */
export function AdminReservationAlerts() {
  const enabled = Platform.OS === 'web'
  useAdminReservationAlerts(enabled)
  return null
}
