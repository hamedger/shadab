import {
  parseTime,
  inSession,
  minutesUntil,
  isWeekendDay,
  computeBuffetStatus,
  formatBuffetTime,
  isBuffetDishServing,
} from '../lib/services/buffetService'
import { RESTAURANT_TIMEZONE } from '../constants/buffet'

describe('buffetService', () => {
  describe('parseTime', () => {
    it('parses HH:MM strings', () => {
      expect(parseTime('11:00')).toEqual({ h: 11, m: 0 })
      expect(parseTime('17:30')).toEqual({ h: 17, m: 30 })
    })
  })

  describe('formatBuffetTime', () => {
    it('formats 24h to 12h display', () => {
      expect(formatBuffetTime('11:00')).toBe('11:00 AM')
      expect(formatBuffetTime('17:00')).toBe('5:00 PM')
    })
  })

  describe('inSession', () => {
    it('returns true during lunch hours', () => {
      const noon = new Date('2026-06-09T12:00:00')
      expect(inSession(noon, '11:00', '15:00')).toBe(true)
    })

    it('returns false outside session', () => {
      const morning = new Date('2026-06-09T10:00:00')
      expect(inSession(morning, '11:00', '15:00')).toBe(false)
    })
  })

  describe('minutesUntil', () => {
    it('calculates minutes until a time today', () => {
      const tenAm = new Date('2026-06-09T10:00:00')
      expect(minutesUntil(tenAm, '11:00')).toBe(60)
    })
  })

  describe('isWeekendDay', () => {
    it('returns true only for Saturday', () => {
      const saturday = new Date('2026-06-06T12:00:00')
      const friday = new Date('2026-06-05T12:00:00')
      expect(isWeekendDay(saturday)).toBe(true)
      expect(isWeekendDay(friday)).toBe(false)
    })
  })

  describe('computeBuffetStatus', () => {
    it('reports open during weekday lunch with default config', () => {
      const mondayNoon = new Date('2026-06-08T12:00:00')
      const status = computeBuffetStatus({
        config: null,
        now: mondayNoon,
        timezone: RESTAURANT_TIMEZONE,
      })
      expect(status.isOpen).toBe(true)
      expect(status.currentSession).toBe('lunch')
      expect(status.currentPrice).toBe(1799)
    })

    it('uses weekend pricing on Saturday', () => {
      const saturdayNoon = new Date('2026-06-06T12:00:00')
      const status = computeBuffetStatus({
        config: null,
        now: saturdayNoon,
        timezone: RESTAURANT_TIMEZONE,
      })
      expect(status.isWeekend).toBe(true)
      expect(status.lunchPrice).toBe(2499)
      expect(status.dinnerPrice).toBe(2499)
    })

    it('uses Firestore weekday and weekend prices for display cards', () => {
      const fridayNoon = new Date('2026-06-12T12:00:00')
      const status = computeBuffetStatus({
        config: {
          weekdayLunchPrice: 1799,
          weekdayDinnerPrice: 1799,
          weekendLunchPrice: 2499,
          weekendDinnerPrice: 2499,
        } as never,
        now: fridayNoon,
        timezone: RESTAURANT_TIMEZONE,
      })

      expect(status.weekdayPrice).toBe(1799)
      expect(status.weekendPrice).toBe(2499)
      expect(status.lunchPrice).toBe(1799)
      expect(status.dinnerPrice).toBe(1799)
    })

    it('reports closed on Sunday', () => {
      const sunday = new Date('2026-06-07T12:00:00')
      const status = computeBuffetStatus({
        config: null,
        now: sunday,
        timezone: RESTAURANT_TIMEZONE,
      })
      expect(status.isOpen).toBe(false)
      expect(status.nextSessionLabel).toContain('Monday')
    })

    it('includes paused dishes on the customer buffet list', () => {
      const mondayNoon = new Date('2026-06-08T12:00:00')
      const status = computeBuffetStatus({
        config: {
          todaysDishes: [
            {
              menuItemId: 'a',
              name: 'Serving Dish',
              isVegetarian: false,
              isNew: false,
              sortOrder: 0,
              isServing: true,
            },
            {
              menuItemId: 'b',
              name: 'Paused Dish',
              isVegetarian: true,
              isNew: false,
              sortOrder: 1,
              isServing: false,
            },
            {
              menuItemId: 'c',
              name: 'Legacy Dish',
              isVegetarian: true,
              isNew: false,
              sortOrder: 2,
            },
          ],
        } as never,
        now: mondayNoon,
        timezone: RESTAURANT_TIMEZONE,
      })

      expect(status.todaysDishes.map((d) => d.menuItemId)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('isBuffetDishServing', () => {
    it('treats missing isServing as serving', () => {
      expect(
        isBuffetDishServing({
          menuItemId: 'x',
          name: 'Test',
          isVegetarian: true,
          isNew: false,
          sortOrder: 0,
        }),
      ).toBe(true)
    })
  })
})
