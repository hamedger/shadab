import {
  parseTime,
  computeBuffetStatus,
  findCurrentMeal,
  formatBuffetTime,
  isBuffetDishServing,
} from '../lib/services/buffetService'
import {
  getCancellationTerms,
  getReservationBlockFullMessage,
  getReservationBlockId,
  getReservationBlockIndex,
  getReservationSeatsLeft,
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
    it('runs dinner 6:30 PM until 1 AM', () => {
      expect(findCurrentMeal('2026-10-16', 18 * 60 + 29)).toBeNull()
      expect(findCurrentMeal('2026-10-16', 18 * 60 + 30)).toEqual({ meal: 'dinner', serviceDate: '2026-10-16' })
      expect(findCurrentMeal('2026-10-17', 30)).toEqual({ meal: 'dinner', serviceDate: '2026-10-16' })
      expect(findCurrentMeal('2026-10-17', 60)).toBeNull()
    })

    it('does not serve breakfast (coming soon)', () => {
      expect(findCurrentMeal('2026-10-21', 8 * 60)).toBeNull()
    })
  })

  describe('computeBuffetStatus', () => {
    it('is closed before the grand opening and points at opening-day dinner', () => {
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-05T12:00:00') })
      expect(status.isOpen).toBe(false)
      expect(status.nextSessionLabel).toMatch(/Grand opening.*Dinner at 6:30 PM/)
      expect(status.meals.map((m) => m.comingSoon)).toEqual([true, true, false])
    })

    it('does not serve breakfast on opening day', () => {
      expect(findCurrentMeal('2026-10-16', 8 * 60)).toBeNull()
      expect(findCurrentMeal('2026-10-16', 19 * 60)).toEqual({ meal: 'dinner', serviceDate: '2026-10-16' })
    })

    it('serves dinner at grand opening prices; breakfast and lunch are coming soon', () => {
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-21T08:00:00') })).toMatchObject({
        isOpen: false,
        nextSessionLabel: 'Dinner opens at 6:30 PM',
      })
      const afternoon = computeBuffetStatus({ config: null, now: chicago('2026-10-18T14:00:00') })
      expect(afternoon).toMatchObject({ isOpen: false, nextSessionLabel: 'Dinner opens at 6:30 PM' })
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-18T19:00:00') })).toMatchObject({
        currentSession: 'dinner',
        currentPrice: 1999,
      })
    })

    it('keeps the promo price through the last promo dinner, then closes at 1 AM', () => {
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-23T00:30:00') })
      expect(status.currentSession).toBe('dinner')
      expect(status.currentPrice).toBe(1999)
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-23T01:30:00') }).isOpen).toBe(false)
    })

    it('switches to regular prices after grand opening week', () => {
      // 2026-10-23 is a Friday, 2026-10-26 a Monday.
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-23T19:00:00') })
      expect(status.currentPrice).toBe(2499)
      expect(status.meals.map((m) => m.priceCents)).toEqual([999, 2499, 2499])
      expect(status.meals.every((m) => !m.isSpecial)).toBe(true)
      const monday = computeBuffetStatus({ config: null, now: chicago('2026-10-26T19:00:00') })
      expect(monday.meals.map((m) => m.priceCents)).toEqual([999, 2499, 2499])
    })

    it('is open on Sundays', () => {
      // 2026-10-18 is a Sunday
      expect(computeBuffetStatus({ config: null, now: chicago('2026-10-18T19:30:00') }).isOpen).toBe(true)
    })

    it('reports the next meal between services', () => {
      const status = computeBuffetStatus({ config: null, now: chicago('2026-10-18T17:30:00') })
      expect(status.isOpen).toBe(false)
      expect(status.nextSessionLabel).toBe('Dinner opens at 6:30 PM')
      expect(status.countdownMinutes).toBe(60)
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
    it('charges adults full price, kids 4–10 half, under 4 free', () => {
      expect(getReservationSubtotalCents('2026-10-16', 'dinner', { adults: 2, children: 1, infants: 1 })).toBe(
        1999 * 2 + 1000,
      )
      // 2026-10-30 is a Friday.
      expect(getReservationSubtotalCents('2026-10-30', 'lunch', { adults: 1, children: 0, infants: 0 })).toBe(2499)
    })

    it('adds 10.75% Chicago restaurant tax to the prepaid total', () => {
      // $24.99 + $2.69 tax
      expect(getReservationTotalCents('2026-10-30', 'lunch', { adults: 1, children: 0, infants: 0 })).toBe(2768)
    })

    it('ends seatings 30 minutes before close', () => {
      const dinner = getReservationSlots('dinner')
      expect(dinner[0]).toBe('6:30 PM')
      expect(dinner[dinner.length - 1]).toBe('12:30 AM')
      const lunch = getReservationSlots('lunch')
      expect(lunch[0]).toBe('2:00 PM')
      expect(lunch[lunch.length - 1]).toBe('4:30 PM')
      expect(getReservationSlots('breakfast').slice(-1)[0]).toBe('12:00 PM')
    })

    it('converts seatings to Chicago time across the DST change', () => {
      expect(getReservationStartMs('2026-10-16', 'dinner', '11:30 PM')).toBe(
        new Date('2026-10-16T23:30:00-05:00').getTime(),
      )
      expect(getReservationStartMs('2026-11-05', 'lunch', '2:00 PM')).toBe(
        new Date('2026-11-05T14:00:00-06:00').getTime(),
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

  describe('reservation capacity blocks', () => {
    it('groups dinner seatings into 90-minute blocks counted from 7:00 PM', () => {
      expect(getReservationBlockIndex('dinner', '6:30 PM')).toBe(0)
      expect(getReservationBlockIndex('dinner', '7:00 PM')).toBe(0)
      expect(getReservationBlockIndex('dinner', '8:15 PM')).toBe(0)
      expect(getReservationBlockIndex('dinner', '8:30 PM')).toBe(1)
      expect(getReservationBlockIndex('dinner', '9:45 PM')).toBe(1)
      expect(getReservationBlockIndex('dinner', '10:00 PM')).toBe(2)
      expect(getReservationBlockIndex('dinner', '11:30 PM')).toBe(3)
      expect(getReservationBlockIndex('dinner', '12:30 AM')).toBe(3)
    })

    it('puts every dinner seating in one of 4 blocks', () => {
      const blocks = new Set(getReservationSlots('dinner').map((slot) => getReservationBlockIndex('dinner', slot)))
      expect([...blocks]).toEqual([0, 1, 2, 3])
    })

    it('builds a per-date block id; after-midnight seatings stay on the evening they belong to', () => {
      expect(getReservationBlockId('2026-10-23', 'dinner', '8:30 PM')).toBe('2026-10-23_dinner_1')
      expect(getReservationBlockId('2026-10-23', 'dinner', '12:15 AM')).toBe('2026-10-23_dinner_3')
      expect(getReservationBlockId('2026-10-23', 'dinner', 'noon')).toBeNull()
    })

    it('caps each block at 100 guests', () => {
      expect(getReservationSeatsLeft(0)).toBe(100)
      expect(getReservationSeatsLeft(95)).toBe(5)
      expect(getReservationSeatsLeft(100)).toBe(0)
      expect(getReservationSeatsLeft(103)).toBe(0)
      expect(getReservationBlockFullMessage(5)).toMatch(/^Only 5 seats left/)
      expect(getReservationBlockFullMessage(1)).toMatch(/^Only 1 seat left/)
      expect(getReservationBlockFullMessage(0)).toMatch(/full/)
    })
  })
})
