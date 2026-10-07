import { Timestamp } from 'firebase/firestore'
import { BuffetSectionId } from '../constants/buffetLayout'
import type { BuffetMeal } from '../constants/buffetSchedule'

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

/** Legacy price/hour fields are no longer read — prices and hours come from constants/buffetSchedule.ts. */
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

export interface BuffetMealStatus {
  meal: BuffetMeal
  label: string
  /** e.g. "7:00 AM – 12:30 PM" */
  hoursLabel: string
  priceCents: number
  regularPriceCents: number
  /** "Every day", "Mon – Thu", or "Fri, Sat & Sun". */
  daysLabel: string
  /** For meals priced by day, the other days' price, e.g. "Mon – Thu $13.99". */
  otherDaysPriceLabel: string | null
  /** True during grand opening week when the special beats the regular price. */
  isSpecial: boolean
}

export interface BuffetStatus {
  isOpen: boolean
  currentSession: BuffetMeal | null
  currentPrice: number
  /** Today's breakfast, lunch, and dinner, in service order. */
  meals: BuffetMealStatus[]
  nextSessionLabel: string
  countdownMinutes: number | null
  todaysDishes: BuffetDish[]
  specialNote: string
  isLoading: boolean
}
