import { formatDineInHoursLabel } from '../lib/locationUtils'
import { LocationHours } from '../types/location'

export function formatBusinessHours(hours: LocationHours): string {
  return formatDineInHoursLabel(hours)
}

export const RESTAURANT_STATS = [
  { value: '4.8★', label: 'Guest Rating' },
  { value: '100%', label: 'Zabiha Halal' },
  { value: '80+', label: 'Menu Items' },
  { value: '15+', label: 'Years Heritage' },
] as const
