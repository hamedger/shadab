import {
  shouldAlertForBuffetRefill,
  snapshotBuffetDishForRefillAlerts,
} from '../lib/admin/buffetRefillAlerts'
import { BuffetDish } from '../types/buffet'

describe('buffetRefillAlerts', () => {
  const dish: BuffetDish = {
    menuItemId: 'butter-chicken',
    name: 'Butter Chicken',
    isVegetarian: false,
    isNew: false,
    sortOrder: 0,
    isServing: true,
    needsRefill: true,
  }

  it('alerts when refill flag turns on', () => {
    const previous = snapshotBuffetDishForRefillAlerts({ ...dish, needsRefill: false })
    expect(shouldAlertForBuffetRefill(previous, dish)).toBe(true)
  })

  it('does not alert when already flagged or cleared', () => {
    const stocked = snapshotBuffetDishForRefillAlerts({ ...dish, needsRefill: false })
    expect(shouldAlertForBuffetRefill(stocked, { ...dish, needsRefill: false })).toBe(false)
    expect(shouldAlertForBuffetRefill(snapshotBuffetDishForRefillAlerts(dish), dish)).toBe(false)
    expect(shouldAlertForBuffetRefill(undefined, dish)).toBe(false)
  })
})
