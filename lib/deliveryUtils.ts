import { PICKUP_ASAP } from './services/pickupScheduling'

export interface DropoffAddressInput {
  street: string
  city: string
  state: string
  zip: string
  country?: string
  unit?: string
  instructions?: string
}

export function toE164USPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

export function isValidUSPhone(phone: string): boolean {
  return toE164USPhone(phone) !== null
}

export function extractFirstName(displayName: string): string {
  const trimmed = displayName.trim()
  if (!trimmed) return 'Guest'
  return trimmed.split(/\s+/)[0]
}

export function formatPickupTimeDisplay(
  pickupDate: string | null | undefined,
  pickupTime: string | null | undefined,
): string | null {
  if (!pickupDate?.trim() || !pickupTime?.trim()) return null
  if (pickupTime === PICKUP_ASAP) return 'ASAP'
  return `${pickupDate} ${pickupTime}`
}
