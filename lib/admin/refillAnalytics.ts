import {
  BUFFET_MEAL_ORDER,
  BUFFET_MEALS,
  BuffetMeal,
  RESTAURANT_TIMEZONE,
  addDaysToDateString,
  getMealWindowMinutes,
  getRestaurantNow,
  restaurantLocalToUtcMs,
} from '../../constants/buffetSchedule'
import { BuffetRefillEvent } from '../../types/buffet'

/** Refills open longer than this are highlighted and trigger a live alert. */
export const REFILL_SLOW_MINUTES = 10
export const REFILL_SLOW_SECONDS = REFILL_SLOW_MINUTES * 60

export type RefillRange = 'today' | 'yesterday' | '7d' | '30d'

export const REFILL_RANGES: { key: RefillRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
]

/** [startMs, endMs) for a range, using restaurant-local calendar days. */
export function getRefillRangeBounds(range: RefillRange, now: Date = new Date()): { startMs: number; endMs: number } {
  const today = getRestaurantNow(now).dateString
  const dayStart = (dateString: string) => restaurantLocalToUtcMs(dateString, 0)
  const tomorrowStart = dayStart(addDaysToDateString(today, 1))
  switch (range) {
    case 'today':
      return { startMs: dayStart(today), endMs: tomorrowStart }
    case 'yesterday':
      return { startMs: dayStart(addDaysToDateString(today, -1)), endMs: dayStart(today) }
    case '7d':
      return { startMs: dayStart(addDaysToDateString(today, -6)), endMs: tomorrowStart }
    case '30d':
      return { startMs: dayStart(addDaysToDateString(today, -29)), endMs: tomorrowStart }
  }
}

/** Meal being served at a moment (handles dinner running past midnight), plus the local hour. */
export function getRefillMealContext(at: Date): { meal: BuffetMeal | null; hour: number } {
  const { minutes } = getRestaurantNow(at)
  const hour = Math.floor(minutes / 60)
  for (const meal of BUFFET_MEAL_ORDER) {
    if (BUFFET_MEALS[meal].comingSoon) continue
    const { start, end } = getMealWindowMinutes(meal)
    if ((minutes >= start && minutes < end) || (minutes + 1440 >= start && minutes + 1440 < end)) {
      return { meal, hour }
    }
  }
  return { meal: null, hour }
}

export function formatRefillDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  const s = Math.max(0, Math.round(seconds))
  if (s < 60) return `${s} sec`
  const totalMin = Math.round(s / 60)
  if (totalMin < 60) return `${totalMin} min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: RESTAURANT_TIMEZONE,
  hour: 'numeric',
  minute: '2-digit',
})
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: RESTAURANT_TIMEZONE,
  month: 'short',
  day: 'numeric',
})

/** "7:42 PM", or "Nov 2, 7:42 PM" when `withDate`. */
export function formatRefillTime(ms: number | null | undefined, withDate = false): string {
  if (ms == null) return '—'
  const d = new Date(ms)
  return withDate ? `${dateFormatter.format(d)}, ${timeFormatter.format(d)}` : timeFormatter.format(d)
}

export function formatHourLabel(hour: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h} ${suffix}`
}

export function isSlowRefill(seconds: number | null | undefined): boolean {
  return seconds != null && seconds >= REFILL_SLOW_SECONDS
}

export interface RefillGroupStats {
  key: string
  label: string
  count: number
  avgSeconds: number | null
  maxSeconds: number | null
  slowCount: number
}

function completed(events: BuffetRefillEvent[]): BuffetRefillEvent[] {
  return events.filter((e) => e.status === 'completed' && e.durationSeconds != null)
}

function statsFor(key: string, label: string, events: BuffetRefillEvent[]): RefillGroupStats {
  const durations = events.map((e) => e.durationSeconds as number)
  const total = durations.reduce((a, b) => a + b, 0)
  return {
    key,
    label,
    count: durations.length,
    avgSeconds: durations.length ? total / durations.length : null,
    maxSeconds: durations.length ? Math.max(...durations) : null,
    slowCount: durations.filter((d) => isSlowRefill(d)).length,
  }
}

function groupBy(events: BuffetRefillEvent[], keyOf: (e: BuffetRefillEvent) => string): Map<string, BuffetRefillEvent[]> {
  const map = new Map<string, BuffetRefillEvent[]>()
  for (const e of events) {
    const k = keyOf(e)
    const list = map.get(k)
    if (list) list.push(e)
    else map.set(k, [e])
  }
  return map
}

export function summarizeRefills(events: BuffetRefillEvent[]): RefillGroupStats {
  return statsFor('all', 'All', completed(events))
}

/** Per dish, slowest average first. */
export function refillStatsByDish(events: BuffetRefillEvent[]): RefillGroupStats[] {
  return [...groupBy(completed(events), (e) => e.menuItemId)]
    .map(([id, list]) => statsFor(id, list[0].dishName, list))
    .sort((a, b) => (b.avgSeconds ?? 0) - (a.avgSeconds ?? 0))
}

/** Per meal, in service order; refills outside buffet hours are grouped as "Outside buffet hours". */
export function refillStatsByMeal(events: BuffetRefillEvent[]): RefillGroupStats[] {
  const groups = groupBy(completed(events), (e) => e.meal ?? 'none')
  const keys: string[] = [...BUFFET_MEAL_ORDER, 'none']
  return keys
    .filter((k) => groups.has(k))
    .map((k) =>
      statsFor(k, k === 'none' ? 'Outside buffet hours' : BUFFET_MEALS[k as BuffetMeal].label, groups.get(k)!),
    )
}

/** Per restaurant-local hour, earliest first. */
export function refillStatsByHour(events: BuffetRefillEvent[]): RefillGroupStats[] {
  return [...groupBy(completed(events), (e) => String(e.hour))]
    .map(([h, list]) => statsFor(h, formatHourLabel(Number(h)), list))
    .sort((a, b) => Number(a.key) - Number(b.key))
}
