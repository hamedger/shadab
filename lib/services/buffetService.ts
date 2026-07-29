import { BUFFET_PRICING, BUFFET_HOURS, BUFFET_DAYS } from '../../constants/buffet'
import { BuffetConfig, BuffetDish, BuffetStatus } from '../../types/buffet'

export function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number)
  return { h, m }
}

export function toTimezoneDate(timezone: string, now = new Date()): Date {
  return new Date(now.toLocaleString('en-US', { timeZone: timezone }))
}

export function isWeekendDay(d: Date): boolean {
  return d.getDay() === 6
}

export function inSession(now: Date, start: string, end: string): boolean {
  const { h: sh, m: sm } = parseTime(start)
  const { h: eh, m: em } = parseTime(end)
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= sh * 60 + sm && mins < eh * 60 + em
}

export function minutesUntil(now: Date, timeStr: string): number {
  const { h, m } = parseTime(timeStr)
  return h * 60 + m - (now.getHours() * 60 + now.getMinutes())
}

export function formatBuffetTime(timeStr: string): string {
  const { h, m } = parseTime(timeStr)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return m === 0 ? `${hour12}:00 ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export interface ComputeBuffetStatusOptions {
  config: BuffetConfig | null
  now: Date
  timezone: string
}

/** Buffet is dinner-only, 5:00 PM – 9:00 PM. */
export function computeBuffetStatus({
  config,
  now,
  timezone,
}: ComputeBuffetStatusOptions): Omit<BuffetStatus, 'isLoading'> {
  const detroitNow = toTimezoneDate(timezone, now)
  const dayOfWeek = detroitNow.getDay()
  const isBuffetDay = BUFFET_DAYS.includes(dayOfWeek)
  const weekend = isWeekendDay(detroitNow)

  const weekdayDinnerPrice = config?.weekdayDinnerPrice ?? BUFFET_PRICING.weekday.dinner
  const weekendDinnerPrice = config?.weekendDinnerPrice ?? BUFFET_PRICING.weekend.dinner
  const dinnerPrice = weekend ? weekendDinnerPrice : weekdayDinnerPrice

  let currentSession: 'dinner' | null = null
  let isOpen = false
  let currentPrice = 0

  if (isBuffetDay) {
    const dinnerActive =
      config?.isDinnerActive ??
      inSession(detroitNow, BUFFET_HOURS.dinner.start, BUFFET_HOURS.dinner.end)

    if (dinnerActive) {
      currentSession = 'dinner'
      isOpen = true
      currentPrice = dinnerPrice
    }
  }

  let nextSessionLabel = 'Closed today'
  let countdownMinutes: number | null = null

  if (isBuffetDay && !isOpen) {
    const minsToDinner = minutesUntil(detroitNow, BUFFET_HOURS.dinner.start)

    if (minsToDinner > 0) {
      nextSessionLabel = `Dinner opens at ${formatBuffetTime(BUFFET_HOURS.dinner.start)}`
      if (minsToDinner <= 120) countdownMinutes = minsToDinner
    } else {
      nextSessionLabel = 'Closed for today'
    }
  } else if (!isBuffetDay) {
    nextSessionLabel =
      dayOfWeek === 0
        ? `Opens Monday at ${formatBuffetTime(BUFFET_HOURS.dinner.start)}`
        : `Next Buffet: Tomorrow at ${formatBuffetTime(BUFFET_HOURS.dinner.start)}`
  }

  const todaysDishes = config?.todaysDishes ?? []

  return {
    isOpen,
    currentSession,
    currentPrice,
    isWeekend: weekend,
    lunchPrice: dinnerPrice,
    dinnerPrice,
    weekdayPrice: weekdayDinnerPrice,
    weekendPrice: weekendDinnerPrice,
    nextSessionLabel,
    countdownMinutes,
    todaysDishes,
    specialNote: config?.specialNote ?? '',
  }
}

export function isBuffetDishServing(dish: BuffetDish): boolean {
  return dish.isServing !== false
}

export function isBuffetDishNeedsRefill(dish: BuffetDish): boolean {
  return dish.needsRefill === true
}
