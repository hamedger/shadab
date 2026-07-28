import React from 'react'
import { Platform } from 'react-native'
import { useAdminBuffetRefillAlerts } from '../../hooks/useAdminBuffetRefillAlerts'

/**
 * Plays a kitchen chime and browser notification when floor staff flag a buffet item for refill.
 */
export function AdminBuffetRefillAlerts() {
  const enabled = Platform.OS === 'web'
  useAdminBuffetRefillAlerts(enabled)
  return null
}
