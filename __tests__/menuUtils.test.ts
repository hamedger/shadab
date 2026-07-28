import {
  filterMenuItems,
  groupMenuByCategory,
  shouldGroupSections,
} from '../lib/menuUtils'
import { MenuItem } from '../types/menu'

const sampleItems = [
  {
    id: '1',
    name: 'Chicken Biryani',
    description: 'Hyderabadi classic',
    price: 1499,
    category: 'biryani',
    tags: ['bestseller'],
    isVegetarian: false,
  },
  {
    id: '2',
    name: 'Veg Samosa',
    description: 'Crispy pastry',
    price: 499,
    category: 'veg-appetizers',
    tags: [],
    isVegetarian: true,
  },
] as MenuItem[]

describe('menuUtils', () => {
  it('filters by search query', () => {
    const result = filterMenuItems(sampleItems, {
      search: 'samosa',
      categoryId: null,
      quickFilter: 'all',
    })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Veg Samosa')
  })

  it('filters vegetarian items', () => {
    const result = filterMenuItems(sampleItems, {
      search: '',
      categoryId: null,
      quickFilter: 'vegetarian',
    })
    expect(result).toHaveLength(1)
    expect(result[0].isVegetarian).toBe(true)
  })

  it('groups items by category order', () => {
    const sections = groupMenuByCategory(sampleItems)
    expect(sections).toHaveLength(2)
    expect(sections[0].categoryId).toBe('biryani')
  })

  it('determines when to show grouped sections', () => {
    expect(shouldGroupSections(null, '', 'all')).toBe(true)
    expect(shouldGroupSections('biryani', '', 'all')).toBe(false)
    expect(shouldGroupSections(null, 'rice', 'all')).toBe(false)
  })
})
