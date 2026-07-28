import {
  filterMenuForDisplay,
  getMenuItemAvailability,
  isMenuItemOrderable,
  withLocationAvailability,
} from '../lib/menuMerge'
import { MenuItem } from '../types/menu'

const baseItem = {
  id: 'test-item',
  name: 'Test Dish',
  description: '',
  price: 999,
  category: 'curries',
  subcategory: '',
  imageURL: '',
  isAvailable: true,
  isHalal: true,
  isVegetarian: false,
  isSpicy: false,
  spiceLevel: 1 as const,
  allergens: [],
  tags: [],
  isBuffetItem: false,
  rating: 0,
  reviewCount: 0,
  locationIds: ['chicago-il', 'farmington-hills-mi'],
} as MenuItem

describe('menuMerge location stock', () => {
  it('uses global availability when no location override exists', () => {
    expect(getMenuItemAvailability(baseItem, 'chicago-il')).toBe(true)
    expect(getMenuItemAvailability({ ...baseItem, isAvailable: false }, 'chicago-il')).toBe(false)
  })

  it('prefers per-location stock override', () => {
    const item: MenuItem = {
      ...baseItem,
      isAvailable: true,
      locationStock: {
        'farmington-hills-mi': { isAvailable: false },
      },
    }
    expect(getMenuItemAvailability(item, 'chicago-il')).toBe(true)
    expect(getMenuItemAvailability(item, 'farmington-hills-mi')).toBe(false)
    expect(isMenuItemOrderable(item, 'farmington-hills-mi')).toBe(false)
  })

  it('hides unavailable items for a location in customer menu', () => {
    const items: MenuItem[] = [
      baseItem,
      {
        ...baseItem,
        id: 'sold-out-here',
        locationStock: { 'chicago-il': { isAvailable: false } },
      },
    ]

    const visible = filterMenuForDisplay(items, 'chicago-il')
    expect(visible.map((i) => i.id)).toEqual(['test-item'])
  })

  it('applies location availability onto the item object', () => {
    const item = withLocationAvailability(
      {
        ...baseItem,
        locationStock: { 'chicago-il': { isAvailable: false } },
      },
      'chicago-il',
    )
    expect(item.isAvailable).toBe(false)
  })
})
