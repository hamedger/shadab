import { Timestamp } from 'firebase/firestore'
import { BuffetSectionId } from '../constants/buffetLayout'

export interface BuffetDish {
  menuItemId: string
  name: string
  isVegetarian: boolean
  isNew: boolean
  sortOrder: number
  /** When false, shown as out of stock on the customer buffet page. Defaults to true. */
  isServing?: boolean
  /** When true, floor staff flagged the station for a kitchen refill. Defaults to false. */
  needsRefill?: boolean
  /** Display section on the buffet board. */
  buffetCategory?: BuffetSectionId
}

export interface BuffetConfig {
  locationId: string
  weekdayLunchPrice: number
  weekdayDinnerPrice: number
  weekendLunchPrice: number
  weekendDinnerPrice: number
  lunchStart: string
  lunchEnd: string
  dinnerStart: string
  dinnerEnd: string
  buffetDays: number[]
  todaysDishes: BuffetDish[]
  isLunchActive: boolean
  isDinnerActive: boolean
  specialNote: string
  updatedAt: Timestamp
}

export interface BuffetStatus {
  isOpen: boolean
  currentSession: 'lunch' | 'dinner' | null
  currentPrice: number
  isWeekend: boolean
  lunchPrice: number
  dinnerPrice: number
  /** Mon–Fri display price for marketing cards */
  weekdayPrice: number
  /** Saturday display price for marketing cards */
  weekendPrice: number
  nextSessionLabel: string
  countdownMinutes: number | null
  todaysDishes: BuffetDish[]
  specialNote: string
  isLoading: boolean
}
