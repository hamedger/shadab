import {
  addDaysToDateString,
  BUFFET_MEAL_ORDER,
  BUFFET_MEALS,
  BuffetMeal,
  formatMinutesLabel,
  getBuffetMealPriceCents,
  getBuffetMealRegularPriceCents,
  getMealWindowMinutes,
  getRestaurantNow,
  GRAND_OPENING_START,
  isGrandOpeningWindow,
  isMealServedOn,
  isWeekendBuffetDay,
  OPENING_DAY_FIRST_MEAL,
} from '../../constants/buffetSchedule'
import { BuffetConfig, BuffetDish, BuffetMealStatus, BuffetStatus } from '../../types/buffet'

export function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number)
  return { h, m }
}

export function formatBuffetTime(timeStr: string): string {
  const { h, m } = parseTime(timeStr)
  return formatMinutesLabel(h * 60 + m)
}

export function formatMealHours(meal: BuffetMeal): string {
  return `${formatBuffetTime(BUFFET_MEALS[meal].start)} – ${formatBuffetTime(BUFFET_MEALS[meal].end)}`
}

const WEEKDAY_LABEL = 'Mon – Thu'
const WEEKEND_LABEL = 'Fri, Sat & Sun'

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function getMealStatusesForDate(dateString: string): BuffetMealStatus[] {
  const weekend = isWeekendBuffetDay(dateString)
  const promo = isGrandOpeningWindow(dateString)
  return BUFFET_MEAL_ORDER.map((meal) => {
    const config = BUFFET_MEALS[meal]
    const priceCents = getBuffetMealPriceCents(dateString, meal)
    const regularPriceCents = getBuffetMealRegularPriceCents(dateString, meal)
    let daysLabel = 'Every day'
    let otherDaysPriceLabel: string | null = null
    if (config.weekend) {
      daysLabel = weekend ? WEEKEND_LABEL : WEEKDAY_LABEL
      const other = weekend ? config : config.weekend
      const otherCents = promo ? other.grandOpeningPriceCents : other.regularPriceCents
      otherDaysPriceLabel = `${weekend ? WEEKDAY_LABEL : WEEKEND_LABEL} ${formatCents(otherCents)}`
    }
    return {
      meal,
      label: config.label,
      hoursLabel: formatMealHours(meal),
      priceCents,
      regularPriceCents,
      daysLabel,
      otherDaysPriceLabel,
      isSpecial: priceCents < regularPriceCents,
    }
  })
}

function formatDateShort(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** The meal being served right now, and the service date it belongs to (dinner runs past midnight). */
export function findCurrentMeal(
  dateString: string,
  minutes: number,
): { meal: BuffetMeal; serviceDate: string } | null {
  const yesterday = addDaysToDateString(dateString, -1)
  for (const meal of BUFFET_MEAL_ORDER) {
    const { start, end } = getMealWindowMinutes(meal)
    if (minutes >= start && minutes < end && isMealServedOn(dateString, meal)) {
      return { meal, serviceDate: dateString }
    }
    // After midnight, still inside last night's service.
    if (end > 1440 && minutes < end - 1440 && isMealServedOn(yesterday, meal)) {
      return { meal, serviceDate: yesterday }
    }
  }
  return null
}

function findNextMeal(
  dateString: string,
  minutes: number,
): { meal: BuffetMeal; serviceDate: string; minutesUntil: number } | null {
  for (let dayOffset = 0; dayOffset <= 31; dayOffset++) {
    const date = addDaysToDateString(dateString, dayOffset)
    for (const meal of BUFFET_MEAL_ORDER) {
      if (!isMealServedOn(date, meal)) continue
      const startFromNow = getMealWindowMinutes(meal).start + dayOffset * 1440 - minutes
      if (startFromNow > 0) return { meal, serviceDate: date, minutesUntil: startFromNow }
    }
  }
  return null
}

export interface ComputeBuffetStatusOptions {
  config: BuffetConfig | null
  now: Date
}

/** Breakfast 7–12:30, lunch 1:30–4, dinner 6 PM–1 AM, every day (America/Chicago). */
export function computeBuffetStatus({
  config,
  now,
}: ComputeBuffetStatusOptions): Omit<BuffetStatus, 'isLoading'> {
  const { dateString, minutes } = getRestaurantNow(now)
  const current = findCurrentMeal(dateString, minutes)
  const displayDate = dateString < GRAND_OPENING_START ? GRAND_OPENING_START : dateString

  let nextSessionLabel = ''
  let countdownMinutes: number | null = null

  if (!current) {
    const next = findNextMeal(dateString, minutes)
    if (next) {
      const time = formatBuffetTime(BUFFET_MEALS[next.meal].start)
      const label = BUFFET_MEALS[next.meal].label
      if (next.serviceDate === dateString) {
        nextSessionLabel = `${label} opens at ${time}`
        if (next.minutesUntil <= 120) countdownMinutes = next.minutesUntil
      } else if (next.serviceDate === addDaysToDateString(dateString, 1)) {
        nextSessionLabel = `${label} tomorrow at ${time}`
      } else if (next.serviceDate === GRAND_OPENING_START && next.meal === OPENING_DAY_FIRST_MEAL) {
        nextSessionLabel = `Grand opening ${formatDateShort(next.serviceDate)} · ${label} at ${time}`
      } else {
        nextSessionLabel = `${label} ${formatDateShort(next.serviceDate)} at ${time}`
      }
    }
  }

  return {
    isOpen: current !== null,
    currentSession: current?.meal ?? null,
    currentPrice: current ? getBuffetMealPriceCents(current.serviceDate, current.meal) : 0,
    meals: getMealStatusesForDate(displayDate),
    nextSessionLabel,
    countdownMinutes,
    todaysDishes: config?.todaysDishes ?? [],
    specialNote: config?.specialNote ?? '',
  }
}

export function isBuffetDishServing(dish: BuffetDish): boolean {
  return dish.isServing !== false
}

export function isBuffetDishNeedsRefill(dish: BuffetDish): boolean {
  return dish.needsRefill === true
}
