import { formatDineInHoursLabel } from '../lib/locationUtils'
import { LocationHours } from '../types/location'

export function formatBusinessHours(hours: LocationHours): string {
  return formatDineInHoursLabel(hours)
}

export const RESTAURANT_STATS = [
  { value: '24/7', label: 'Open 24 Hours' },
  { value: '100%', label: 'Zabihah Halal' },
  { value: '40+', label: 'Dinner Buffet Items' },
  { value: 'Devon Ave', label: 'Chicago' },
] as const
