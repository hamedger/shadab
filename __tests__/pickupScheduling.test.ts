import {
  buildPickupTimeSlots,
  formatPickupSchedule,
  getCustomPickupTimeInputBounds,
  getPickupDateOptions,
  getPickupTimeSlotsForDate,
  isCustomPickupTimeValid,
  isPickupScheduleValid,
  isPresetPickupTime,
  normalizePickupTimeValue,
  pickupTimeFromInputValue,
  PICKUP_ASAP,
  getDefaultPickupDate,
} from '../lib/services/pickupScheduling'
import { LOCATION_ORDER_FULFILLMENT_HOURS } from '../constants/config'

const northvilleHours = LOCATION_ORDER_FULFILLMENT_HOURS['chicago-il']

describe('pickupScheduling', () => {
  it('returns today and tomorrow only', () => {
    const options = getPickupDateOptions()
    expect(options.length).toBe(2)
    expect(options[0].label).toBe('Today')
    expect(options[0].value).toBe(getDefaultPickupDate())
    expect(options[1].label).toBe('Tomorrow')
  })

  it('includes ASAP for today and filters past slots', () => {
    // ASAP is only offered while the restaurant is actually open, so pin "now" to
    // a fixed time within Northville's hours (2:00 PM EDT) to keep this deterministic.
    jest.useFakeTimers().setSystemTime(new Date('2099-06-15T18:00:00Z'))
    try {
      const today = getDefaultPickupDate()
      const slots = getPickupTimeSlotsForDate(today, 30, northvilleHours)
      expect(slots[0]).toBe(PICKUP_ASAP)
      expect(slots.length).toBeGreaterThan(1)
      expect(slots[slots.length - 1]).toBe('10:00 PM')
    } finally {
      jest.useRealTimers()
    }
  })

  it('builds Chicago slots through 10:00 PM', () => {
    const slots = buildPickupTimeSlots(northvilleHours)
    expect(slots[slots.length - 1]).toBe('10:00 PM')
  })

  it('formats scheduled pickup', () => {
    expect(formatPickupSchedule('2099-06-15', '6:30 PM')).toMatch(/6:30 PM/)
    expect(formatPickupSchedule(getDefaultPickupDate(), PICKUP_ASAP)).toContain('ASAP')
  })

  it('accepts custom pickup times within hours', () => {
    expect(normalizePickupTimeValue('18:45')).toBe('6:45 PM')
    expect(isPresetPickupTime('6:45 PM', northvilleHours)).toBe(false)
    expect(isCustomPickupTimeValid('2099-06-15', '6:45 PM', 30, northvilleHours)).toBe(true)
    expect(isPickupScheduleValid('2099-06-15', '6:45 PM', 30, northvilleHours)).toBe(false)
    expect(isPickupScheduleValid(getPickupDateOptions()[1].value, '6:30 PM', 30, northvilleHours)).toBe(true)
  })

  it('rejects custom pickup times outside hours', () => {
    expect(isCustomPickupTimeValid('2099-06-15', '10:15 AM', 30, northvilleHours)).toBe(false)
    expect(isCustomPickupTimeValid('2099-06-15', '10:15 PM', 30, northvilleHours)).toBe(false)
    expect(isPickupScheduleValid('2099-06-15', '11:15 PM', 30, northvilleHours)).toBe(false)
  })

  it('provides input bounds for custom time picker', () => {
    const bounds = getCustomPickupTimeInputBounds('2099-06-15', 30, northvilleHours)
    expect(bounds.min).toBe('11:30')
    expect(bounds.max).toBe('22:00')
    expect(pickupTimeFromInputValue('18:15')).toBe('6:15 PM')
  })
})
