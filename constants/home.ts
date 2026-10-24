import { formatDineInHoursLabel } from '../lib/locationUtils'
import { isOpen24HoursOn } from './config'
import { BREAKFAST_AND_24_HOURS_START_LABEL } from './buffetSchedule'
import { LocationHours } from '../types/location'

export function formatBusinessHours(hours: LocationHours): string {
  return formatDineInHoursLabel(hours)
}

export const RESTAURANT_STATS = [
  { value: '24/7', label: isOpen24HoursOn() ? 'Open 24 Hours' : `24 Hours from ${BREAKFAST_AND_24_HOURS_START_LABEL}` },
  { value: '100%', label: 'Zabihah Halal' },
  { value: 'Devon Ave', label: 'Chicago' },
] as const
