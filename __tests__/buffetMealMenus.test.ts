import { computeBuffetStatus } from '../lib/services/buffetService'
import { isMealSwitchedOn } from '../constants/buffetSchedule'
import { syncRefillLineWithMenu } from '../lib/buffetMenuText'
import type { BuffetConfig, BuffetDish } from '../types/buffet'

const chicago = (local: string) => new Date(`${local}-05:00`)
const config = (extra: Partial<BuffetConfig>) => ({ todaysDishes: [], specialNote: '', ...extra }) as unknown as BuffetConfig

describe('per-meal serving switches', () => {
  it('defaults to on, keeps coming-soon lunch off', () => {
    expect(isMealSwitchedOn(undefined, 'breakfast')).toBe(true)
    expect(isMealSwitchedOn({ dinner: false }, 'dinner')).toBe(false)
    expect(isMealSwitchedOn({ lunch: true }, 'lunch')).toBe(false)
  })

  it('a switched-off meal is not open and shows as not serving', () => {
    const status = computeBuffetStatus({ config: config({ mealServing: { dinner: false } }), now: chicago('2026-11-04T19:00:00') })
    expect(status.isOpen).toBe(false)
    expect(status.meals.find((m) => m.meal === 'dinner')?.notServing).toBe(true)
    expect(status.nextSessionLabel).toBe('Breakfast tomorrow at 7:00 AM')
  })

  it('shows uploaded menus only for meals that are serving, in service order', () => {
    const status = computeBuffetStatus({
      config: config({
        mealServing: { breakfast: false },
        mealMenus: { dinner: { text: 'Chicken 65' }, breakfast: { text: 'Halwa Puri' }, lunch: { text: 'x' } },
      }),
      now: chicago('2026-11-04T19:00:00'),
    })
    expect(status.mealMenus.map((m) => m.meal)).toEqual(['dinner'])
  })
})

describe('per-meal refill line', () => {
  it('uploading one meal keeps other meals and drops legacy dishes', () => {
    const legacy = { menuItemId: 'butter-chicken', name: 'Butter Chicken' } as BuffetDish
    const breakfast = syncRefillLineWithMenu([legacy], 'breakfast', 'Halwa Puri\nOmelette')
    expect(breakfast.removed.map((d) => d.name)).toEqual(['Butter Chicken'])
    const dinner = syncRefillLineWithMenu(breakfast.next, 'dinner', 'Chicken 65')
    expect(dinner.next.map((d) => `${d.meal}:${d.name}`)).toEqual([
      'breakfast:Halwa Puri',
      'breakfast:Omelette',
      'dinner:Chicken 65',
    ])
    expect(dinner.removed).toEqual([])
  })
})
