import {
  BUFFET_MEALS,
  BuffetMeal,
  getBuffetMealPriceCents,
  getRestaurantNow,
  hasGrandOpeningEnded as hasGrandOpeningEndedOn,
  isGrandOpeningWindow as isGrandOpeningWindowOn,
} from './buffetSchedule'

export * from './buffetSchedule'

/** Shown as an in-person policy note; not redeemed online. */
export const STUDENT_BUFFET_DISCOUNT_PERCENT = 20

function todayDateString(): string {
  return getRestaurantNow().dateString
}

export function isGrandOpeningWindow(dateString: string = todayDateString()): boolean {
  return isGrandOpeningWindowOn(dateString)
}

/** True once the grand opening promo is over — use to hide grand opening announcements. */
export function hasGrandOpeningEnded(dateString: string = todayDateString()): boolean {
  return hasGrandOpeningEndedOn(dateString)
}

/** Price for a meal on a date; defaults to today. */
export function getMealPriceCents(meal: BuffetMeal, dateString: string = todayDateString()): number {
  return getBuffetMealPriceCents(dateString, meal)
}

/** Breakfast, lunch, and dinner hours, served every day. */
export const BUFFET_HOURS = {
  breakfast: { start: BUFFET_MEALS.breakfast.start, end: BUFFET_MEALS.breakfast.end },
  lunch: { start: BUFFET_MEALS.lunch.start, end: BUFFET_MEALS.lunch.end },
  dinner: { start: BUFFET_MEALS.dinner.start, end: BUFFET_MEALS.dinner.end },
}

// 0=Sun, 1=Mon ... 6=Sat — open every day
export const BUFFET_DAYS = [0, 1, 2, 3, 4, 5, 6]

/** Buffet station highlights from the grand opening flyer. */
export const BUFFET_HIGHLIGHTS = [
  { icon: 'restaurant-outline', label: '40+ item lunch & dinner buffet' },
  { icon: 'water-outline', label: 'Pani puri station' },
  { icon: 'fish-outline', label: 'Fish specialties' },
  { icon: 'flame-outline', label: 'Chicken specialties' },
  { icon: 'happy-outline', label: 'Kids specials' },
  { icon: 'leaf-outline', label: 'Vegetarian specialties' },
  { icon: 'ice-cream-outline', label: 'Ice cream stations' },
  { icon: 'cafe-outline', label: 'Dessert specialties' },
] as const

export const MUTTON_SPECIALTIES = [
  'Zafrani Mutton Dum Biryani',
  'Sufiyani Mutton Dum Biryani',
  'Mutton Haleem',
  'Shahi Mutton Marag',
  'Mughlai Mutton',
  'Mutton Masala',
] as const
