import {
  parseTime,
  computeBuffetStatus,
  findCurrentMeal,
  formatBuffetTime,
  isBuffetDishServing,
} from '../lib/services/buffetService'
import {
  getCancellationTerms,
  getReservationSlots,
  getReservationStartMs,
  getReservationSubtotalCents,
  getReservationTotalCents,
} from '../constants/buffetSchedule'

// America/Chicago is UTC-5 (CDT) in October 2026, UTC-6 (CST) from Nov 1.
const chicago = (iso: string) => new Date(`${iso}-05:00`)

describe('buffetService', () => {
  describe('parseTime', () => {
    it('parses HH:MM strings', () => {
      expect(parseTime('11:00')).toEqual({ h: 11, m: 0 })
      expect(parseTime('17:30')).toEqual({ h: 17, m: 30 })
    })
  })

  describe('formatBuffetTime', () => {
    it('formats 24h to 12h display', () => {
      expect(formatBuffetTime('07:00')).toBe('7:00 AM')
      expect(formatBuffetTime('18:00')).toBe('6:00 PM')
      expect(formatBuffetTime('01:00')).toBe('1:00 AM')
    })
  })

  describe('findCurrentMeal', () => {
    it('maps after-midnight minutes to the previous evening dinner', () => {
      expect(findCurrentMeal('2026-10-17', 30)).toEqual({ meal: 'dinner', serviceDate: '2026-10-16' })
      expect(findCurrentMeal('2026-10-17', 75)).toBeNull()
    })
  })

  describe('computeBuffetStatus', () => {
    it('is closed before the grand opening and points at opening-day dinner', () => {
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-05T12:00:00') })
      expect(status.isOpen).toBe(false)
      expect(status.nextSessionLabel).toMatch(/Grand opening.*Dinner at 6:00 PM/)
      expect(status.meals.map((m) => m.priceCents)).toEqual([999, 1299, 1499])
    })

    it('serves breakfast, lunch, and dinner at grand opening prices', () => {
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-18T08:00:00') })).toMatchObject({
        isOpen: true,
        currentSession: 'breakfast',
        currentPrice: 999,
      })
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-18T14:00:00') })).toMatchObject({
        currentSession: 'lunch',
        currentPrice: 1299,
      })
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-18T19:00:00') })).toMatchObject({
        currentSession: 'dinner',
        currentPrice: 1499,
      })
    })

    it('keeps the promo price for dinner running past midnight on the last promo night', () => {
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-23T00:30:00') })
      expect(status.currentSession).toBe('dinner')
      expect(status.currentPrice).toBe(1499)
    })

    it('switches to regular prices after grand opening week', () => {
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-23T19:00:00') })
      expect(status.currentPrice).toBe(2499)
      expect(status.meals.map((m) => m.priceCents)).toEqual([999, 1999, 2499])
      expect(status.meals.every((m) => !m.isSpecial)).toBe(true)
    })

    it('is open on Sundays', () => {
      // 2026-10-18 is a Sunday
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-18T13:30:00') }).isOpen).toBe(true)
    })

    it('reports the next meal between services', () => {
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-18T16:30:00') })
      expect(status.isOpen).toBe(false)
      expect(status.nextSessionLabel).toBe('Dinner opens at 6:00 PM')
      expect(status.countdownMinutes).toBe(90)
    })

    it('includes paused dishes on the customer buffet list', () => {
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
        now: chicago('2026-10-19T12:00:00'),
      })

      expect(status.todaysDishes.map((d) => d.menuItemId)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('reservation pricing', () => {
    it('charges adults full price, kids 5–10 half, under 5 free', () => {
      expect(getReservationSubtotalCents('2026-10-16', 'dinner', { adults: 2, children: 1, infants: 1 })).toBe(
        1499 * 2 + 750,
      )
      expect(getReservationSubtotalCents('2026-10-30', 'lunch', { adults: 1, children: 0, infants: 0 })).toBe(1999)
    })

    it('adds 10.75% Chicago restaurant tax to the prepaid total', () => {
      // $19.99 + $2.15 tax
      expect(getReservationTotalCents('2026-10-30', 'lunch', { adults: 1, children: 0, infants: 0 })).toBe(2214)
    })

    it('ends seatings 30 minutes before close, including after midnight', () => {
      const dinner = getReservationSlots('dinner')
      expect(dinner[0]).toBe('6:00 PM')
      expect(dinner[dinner.length - 1]).toBe('12:30 AM')
      expect(getReservationSlots('breakfast').slice(-1)[0]).toBe('12:00 PM')
    })

    it('places after-midnight dinner seatings on the next calendar day', () => {
      expect(getReservationStartMs('2026-10-16', 'dinner', '12:30 AM')).toBe(
        new Date('2026-10-17T00:30:00-05:00').getTime(),
      )
      expect(getReservationStartMs('2026-11-05', 'lunch', '1:00 PM')).toBe(
        new Date('2026-11-05T13:00:00-06:00').getTime(),
      )
    })
  })

  describe('cancellation policy', () => {
    const start = new Date('2026-10-20T19:00:00-05:00').getTime()
    const hour = 60 * 60 * 1000

    it('refunds in full 48+ hours before seating', () => {
      expect(getCancellationTerms(5000, start, start - 49 * hour)).toEqual({
        isLateCancellation: false,
        feeCents: 0,
        refundCents: 5000,
      })
    })

    it('keeps 20% within 48 hours', () => {
      expect(getCancellationTerms(5000, start, start - 47 * hour)).toEqual({
        isLateCancellation: true,
        feeCents: 1000,
        refundCents: 4000,
      })
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
