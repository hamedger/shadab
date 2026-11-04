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
  /** Meal whose pasted menu this dish came from (Admin → Buffet). Legacy dishes have none. */
  meal?: BuffetMeal
  /** Epoch ms when the current refill was requested (set while needsRefill is true). */
  refillRequestedAt?: number | null
  /** `buffetRefills` doc id for the open refill (set while needsRefill is true). */
  refillEventId?: string | null
}

export interface BuffetMealMenu {
  text: string
  updatedAt?: Timestamp | null
  updatedBy?: string | null
}

export type BuffetRefillStatus = 'open' | 'completed' | 'cancelled'

/** One refill request → restock cycle, stored in the `buffetRefills` collection. */
export interface BuffetRefillEvent {
  id: string
  locationId: string
  menuItemId: string
  dishName: string
  status: BuffetRefillStatus
  requestedAt: Timestamp
  completedAt: Timestamp | null
  /** completedAt − requestedAt, in seconds; null until completed. */
  durationSeconds: number | null
  /** Meal being served when requested, or null outside buffet hours. */
  meal: BuffetMeal | null
  /** Restaurant-local (America/Chicago) hour 0–23 when requested. */
  hour: number
  requestedBy: string | null
  completedBy: string | null
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
  /** Per-meal menus pasted in Admin → Buffet and uploaded; shown on the website as-is. */
  mealMenus?: Partial<Record<BuffetMeal, BuffetMealMenu>>
  /** Per-meal Serving switch. Off = not bookable, menu hidden, not shown as open. Missing = on. */
  mealServing?: Partial<Record<BuffetMeal, boolean>>
  updatedAt: Timestamp
}

export interface BuffetMealStatus {
  meal: BuffetMeal
  label: string
  /** e.g. "7:00 AM – 12:30 PM" */
  hoursLabel: string
  /** Not served yet — show "Coming soon" instead of hours and price. */
  comingSoon: boolean
  /** e.g. "Starts Wed, Oct 21" for breakfast before it launches. */
  startsOnLabel?: string | null
  priceCents: number
  regularPriceCents: number
  /** "Every day", "Mon – Thu", or "Fri, Sat & Sun". */
  daysLabel: string
  /** For meals priced by day, the other days' price, e.g. "Mon – Thu $13.99". */
  otherDaysPriceLabel: string | null
  /** True during grand opening week when the special beats the regular price. */
  isSpecial: boolean
  /** Switched off in Admin → Buffet: not bookable and not served today. */
  notServing: boolean
}

export interface BuffetStatus {
  isOpen: boolean
  currentSession: BuffetMeal | null
  currentPrice: number
  /** Today's breakfast, lunch (coming soon), and dinner, in service order. */
  meals: BuffetMealStatus[]
  nextSessionLabel: string
  countdownMinutes: number | null
  todaysDishes: BuffetDish[]
  specialNote: string
  /** Uploaded menus of meals that are serving, in service order; empty → show todaysDishes. */
  mealMenus: { meal: BuffetMeal; label: string; text: string }[]
  isLoading: boolean
}
