import { Timestamp } from 'firebase/firestore'

export interface Address {
  id: string
  label: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  unit?: string
  instructions?: string
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface User {
  uid: string
  email: string
  phone: string
  displayName: string
  photoURL: string
  isGuest: boolean
  addresses: Address[]
  defaultAddressId: string
  loyaltyPoints: number
  loyaltyTier: LoyaltyTier
  totalOrderCount: number
  totalSpend: number
  dietaryPreferences: string[]
  pushToken: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
