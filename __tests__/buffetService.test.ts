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
    it('is closed before the grand opening and points at opening-day lunch', () => {
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-05T12:00:00') })
      expect(status.isOpen).toBe(false)
      expect(status.nextSessionLabel).toMatch(/Grand opening.*Lunch at 1:30 PM/)
      // Opening day is a Friday — weekend lunch pricing.
      expect(status.meals.map((m) => m.priceCents)).toEqual([999, 1999, 1999])
      expect(status.meals[1]).toMatchObject({ daysLabel: 'Fri, Sat & Sun', otherDaysPriceLabel: 'Mon – Thu $13.99' })
    })

    it('does not serve breakfast on opening day', () => {
      expect(findCurrentMeal('2026-10-16', 8 * 60)).toBeNull()
      expect(findCurrentMeal('2026-10-16', 14 * 60)).toEqual({ meal: 'lunch', serviceDate: '2026-10-16' })
    })

    it('serves breakfast, lunch, and dinner at grand opening prices', () => {
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-18T08:00:00') })).toMatchObject({
        isOpen: true,
        currentSession: 'breakfast',
        currentPrice: 999,
      })
      // Sunday lunch is the weekend "Grand Lunch"; Monday lunch is the weekday price.
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-18T14:00:00') })).toMatchObject({
        currentSession: 'lunch',
        currentPrice: 1999,
      })
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-19T14:00:00') })).toMatchObject({
        currentSession: 'lunch',
        currentPrice: 1399,
      })
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-18T19:00:00') })).toMatchObject({
        currentSession: 'dinner',
        currentPrice: 1999,
      })
    })

    it('keeps the promo price for dinner running past midnight on the last promo night', () => {
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-23T00:30:00') })
      expect(status.currentSession).toBe('dinner')
      expect(status.currentPrice).toBe(1999)
    })

    it('switches to regular prices after grand opening week', () => {
      // 2026-10-23 is a Friday, 2026-10-26 a Monday.
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-23T19:00:00') })
      expect(status.currentPrice).toBe(2499)
      expect(status.meals.map((m) => m.priceCents)).toEqual([999, 2499, 2499])
      expect(status.meals.every((m) => !m.isSpecial)).toBe(true)
      const monday = computeBuffetStatus({ config: null, now: chicago('2026-10-26T19:00:00') })
      expect(monday.meals.map((m) => m.priceCents)).toEqual([999, 1399, 2499])
    })

    it('is open on Sundays', () => {
      // 2026-10-18 is a Sunday
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-18T13:45:00') }).isOpen).toBe(true)
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
        1999 * 2 + 1000,
      )
      // 2026-10-29 is a Thursday (weekday lunch), 2026-10-30 a Friday (weekend lunch).
      expect(getReservationSubtotalCents('2026-10-29', 'lunch', { adults: 1, children: 0, infants: 0 })).toBe(1399)
      expect(getReservationSubtotalCents('2026-10-30', 'lunch', { adults: 1, children: 0, infants: 0 })).toBe(2499)
    })

    it('adds 10.75% Chicago restaurant tax to the prepaid total', () => {
      // $13.99 + $1.50 tax
      expect(getReservationTotalCents('2026-10-29', 'lunch', { adults: 1, children: 0, infants: 0 })).toBe(1549)
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
      expect(getReservationStartMs('2026-11-05', 'lunch', '1:30 PM')).toBe(
        new Date('2026-11-05T13:30:00-06:00').getTime(),
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
