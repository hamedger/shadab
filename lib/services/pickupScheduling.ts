import { addDays, format, isToday, parse, setHours, setMinutes } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { MOCK_PICKUP_ETA_MINUTES } from '../../constants/checkout'
import {
  DEFAULT_LOCATION_ID,
  DEFAULT_PICKUP_PREP_BUFFER_MINUTES,
  LOCATION_ORDER_FULFILLMENT_HOURS,
  TIMEZONE,
} from '../../constants/config'
import { OrderFulfillmentHours } from '../../types/location'

export const PICKUP_ASAP = 'asap'
/** Today + tomorrow only. */
export const PICKUP_ADVANCE_DAYS = 2
export const PICKUP_PREP_BUFFER_MINUTES = DEFAULT_PICKUP_PREP_BUFFER_MINUTES

const SLOT_INTERVAL_MINUTES = 30

export type PickupTimeSlot = string | typeof PICKUP_ASAP

export interface PickupDateOption {
  value: string
  label: string
  sublabel: string
}

function detroitNow(): Date {
  return toZonedTime(new Date(), TIMEZONE)
}

function parseHHmmToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return hours * 60 + minutes
}

function parseTimeSlotMinutes(slot: string): number {
  const parsed = parse(slot, 'h:mm a', detroitNow())
  return parsed.getHours() * 60 + parsed.getMinutes()
}

function minutesToTimeSlot(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const date = setMinutes(setHours(detroitNow(), hours), mins)
  return format(date, 'h:mm a')
}

function minutesToInputValue(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function formatFulfillmentHoursLabel(hours: OrderFulfillmentHours): string {
  return `${minutesToTimeSlot(parseHHmmToMinutes(hours.open))} and ${minutesToTimeSlot(parseHHmmToMinutes(hours.close))}`
}

export function buildPickupTimeSlots(hours: OrderFulfillmentHours): string[] {
  const openMinutes = parseHHmmToMinutes(hours.open)
  const closeMinutes = parseHHmmToMinutes(hours.close)
  const slots: string[] = []

  for (let minutes = openMinutes; minutes <= closeMinutes; minutes += SLOT_INTERVAL_MINUTES) {
    slots.push(minutesToTimeSlot(minutes))
  }

  return slots
}

export const PICKUP_TIME_SLOTS = buildPickupTimeSlots(
  LOCATION_ORDER_FULFILLMENT_HOURS[DEFAULT_LOCATION_ID],
)

function resolveFulfillmentHours(
  fulfillmentHours?: OrderFulfillmentHours,
): OrderFulfillmentHours {
  if (fulfillmentHours) return fulfillmentHours
  return { ...LOCATION_ORDER_FULFILLMENT_HOURS[DEFAULT_LOCATION_ID] }
}

function getOpenMinutes(fulfillmentHours?: OrderFulfillmentHours): number {
  return parseHHmmToMinutes(resolveFulfillmentHours(fulfillmentHours).open)
}

function getCloseMinutes(fulfillmentHours?: OrderFulfillmentHours): number {
  return parseHHmmToMinutes(resolveFulfillmentHours(fulfillmentHours).close)
}

function getMinPickupMinutesForDate(
  dateValue: string,
  prepBufferMinutes: number,
  fulfillmentHours?: OrderFulfillmentHours,
): number {
  const date = parse(dateValue, 'yyyy-MM-dd', detroitNow())
  const openMinutes = getOpenMinutes(fulfillmentHours)
  if (isToday(date)) {
    return Math.max(openMinutes, detroitMinutesNow() + prepBufferMinutes)
  }
  return openMinutes
}

export function isPresetPickupTime(
  timeValue: string,
  fulfillmentHours?: OrderFulfillmentHours,
): boolean {
  if (!timeValue || timeValue === PICKUP_ASAP) return timeValue === PICKUP_ASAP
  const slots = buildPickupTimeSlots(resolveFulfillmentHours(fulfillmentHours))
  return slots.includes(timeValue)
}

export function normalizePickupTimeValue(timeValue: string): string | null {
  const trimmed = timeValue.trim()
  if (!trimmed) return null

  const presetParsed = parse(trimmed, 'h:mm a', detroitNow())
  if (!Number.isNaN(presetParsed.getTime())) {
    return format(presetParsed, 'h:mm a')
  }

  const h24Parsed = parse(trimmed, 'HH:mm', detroitNow())
  if (!Number.isNaN(h24Parsed.getTime())) {
    return format(h24Parsed, 'h:mm a')
  }

  return null
}

export function getPickupTimeMinutes(timeValue: string): number | null {
  if (timeValue === PICKUP_ASAP) return null
  const normalized = normalizePickupTimeValue(timeValue)
  if (!normalized) return null
  return parseTimeSlotMinutes(normalized)
}

export function isCustomPickupTimeValid(
  dateValue: string,
  timeValue: string,
  prepBufferMinutes: number = PICKUP_PREP_BUFFER_MINUTES,
  fulfillmentHours?: OrderFulfillmentHours,
): boolean {
  const minutes = getPickupTimeMinutes(timeValue)
  if (minutes === null) return false
  if (minutes < getMinPickupMinutesForDate(dateValue, prepBufferMinutes, fulfillmentHours)) {
    return false
  }
  if (minutes > getCloseMinutes(fulfillmentHours)) return false
  return true
}

export function getCustomPickupTimeInputBounds(
  dateValue: string,
  prepBufferMinutes: number = PICKUP_PREP_BUFFER_MINUTES,
  fulfillmentHours?: OrderFulfillmentHours,
): { min: string; max: string } {
  return {
    min: minutesToInputValue(
      getMinPickupMinutesForDate(dateValue, prepBufferMinutes, fulfillmentHours),
    ),
    max: minutesToInputValue(getCloseMinutes(fulfillmentHours)),
  }
}

export function pickupTimeToInputValue(timeValue: string): string {
  const minutes = getPickupTimeMinutes(timeValue)
  return minutes === null ? '' : minutesToInputValue(minutes)
}

export function pickupTimeFromInputValue(inputValue: string): string | null {
  return normalizePickupTimeValue(inputValue)
}

function detroitMinutesNow(): number {
  const now = detroitNow()
  return now.getHours() * 60 + now.getMinutes()
}

export function getDefaultPickupDate(): string {
  return format(detroitNow(), 'yyyy-MM-dd')
}

export function getPickupDateOptions(): PickupDateOption[] {
  const now = detroitNow()
  return Array.from({ length: PICKUP_ADVANCE_DAYS }, (_, i) => {
    const date = addDays(now, i)
    const value = format(date, 'yyyy-MM-dd')
    const label =
      i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'EEE, MMM d')
    const sublabel = format(date, 'MMM d')
    return { value, label, sublabel }
  })
}

/** ASAP only makes sense if starting prep right now would land within the fulfillment window. */
function isAsapWithinHours(
  prepBufferMinutes: number,
  fulfillmentHours?: OrderFulfillmentHours,
): boolean {
  const nowPlusBuffer = detroitMinutesNow() + prepBufferMinutes
  return (
    nowPlusBuffer >= getOpenMinutes(fulfillmentHours) &&
    nowPlusBuffer <= getCloseMinutes(fulfillmentHours)
  )
}

export function getPickupTimeSlotsForDate(
  dateValue: string,
  prepBufferMinutes: number = PICKUP_PREP_BUFFER_MINUTES,
  fulfillmentHours?: OrderFulfillmentHours,
): PickupTimeSlot[] {
  const date = parse(dateValue, 'yyyy-MM-dd', detroitNow())
  const slots: PickupTimeSlot[] = []
  const resolvedHours = resolveFulfillmentHours(fulfillmentHours)
  const closeMinutes = getCloseMinutes(resolvedHours)

  if (isToday(date) && isAsapWithinHours(prepBufferMinutes, resolvedHours)) {
    slots.push(PICKUP_ASAP)
  }

  const minMinutes = isToday(date)
    ? detroitMinutesNow() + prepBufferMinutes
    : getOpenMinutes(resolvedHours)

  for (const slot of buildPickupTimeSlots(resolvedHours)) {
    const slotMinutes = parseTimeSlotMinutes(slot)
    if (slotMinutes >= minMinutes && slotMinutes <= closeMinutes) {
      slots.push(slot)
    }
  }

  return slots
}

export function formatPickupSchedule(dateValue: string, timeValue: string): string {
  if (timeValue === PICKUP_ASAP) {
    return `Today · ASAP (~${MOCK_PICKUP_ETA_MINUTES} min)`
  }

  const date = parse(dateValue, 'yyyy-MM-dd', detroitNow())
  const dateLabel = isToday(date)
    ? 'Today'
    : format(date, 'EEE, MMM d')
  return `${dateLabel} at ${timeValue}`
}

export function isPickupScheduleValid(
  dateValue: string,
  timeValue: string,
  prepBufferMinutes: number = PICKUP_PREP_BUFFER_MINUTES,
  fulfillmentHours?: OrderFulfillmentHours,
): boolean {
  if (!dateValue || !timeValue) return false

  const allowedDates = new Set(getPickupDateOptions().map((option) => option.value))
  if (!allowedDates.has(dateValue)) return false

  if (timeValue === PICKUP_ASAP) {
    const date = parse(dateValue, 'yyyy-MM-dd', detroitNow())
    return isToday(date) && isAsapWithinHours(prepBufferMinutes, fulfillmentHours)
  }
  if (isPresetPickupTime(timeValue, fulfillmentHours)) {
    const available = getPickupTimeSlotsForDate(dateValue, prepBufferMinutes, fulfillmentHours)
    return available.includes(timeValue as PickupTimeSlot)
  }
  return isCustomPickupTimeValid(dateValue, timeValue, prepBufferMinutes, fulfillmentHours)
}
