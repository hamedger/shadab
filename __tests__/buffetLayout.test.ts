import { groupBuffetDishesForCustomer, createDefaultBuffetDishes, buildAdminBuffetSections, countAdminBuffetRefillStatus } from '../lib/buffetLayout'
import { BuffetDish } from '../types/buffet'

describe('buffetLayout', () => {
  const sampleDishes: BuffetDish[] = [
    {
      menuItemId: 'butter-chicken',
      name: 'Butter Chicken',
      isVegetarian: false,
      isNew: false,
      sortOrder: 0,
      isServing: true,
    },
    {
      menuItemId: 'veg-samosa',
      name: 'Samosa',
      isVegetarian: true,
      isNew: false,
      sortOrder: 1,
      isServing: true,
    },
    {
      menuItemId: 'tarka-dal',
      name: 'Dal',
      isVegetarian: true,
      isNew: false,
      sortOrder: 2,
      isServing: false,
    },
  ]

  it('groups all buffet dishes by section with paused items last', () => {
    const groups = groupBuffetDishesForCustomer(sampleDishes)
    expect(groups.map((g) => g.id)).toEqual(['veg-vegan-starters', 'vegan-entrees', 'chicken-options'])
    expect(groups[0].dishes.map((d) => d.menuItemId)).toEqual(['veg-samosa'])
    expect(groups[0].dishes[0].name).toBe('Samosa (Vegan)')
    expect(groups[1].dishes.map((d) => d.menuItemId)).toEqual(['tarka-dal'])
    expect(groups[2].dishes.map((d) => d.menuItemId)).toEqual(['butter-chicken'])
  })

  it('builds default buffet dishes from static menu ids', () => {
    const dishes = createDefaultBuffetDishes([
      { id: 'veg-samosa', isVegetarian: true },
      { id: 'butter-chicken', isVegetarian: false },
      { id: 'water', isVegetarian: true },
    ])

    expect(dishes.map((d) => d.menuItemId)).toEqual(['veg-samosa', 'butter-chicken', 'water'])
    expect(dishes[0].name).toBe('Samosa (Vegan)')
    expect(dishes[0].buffetCategory).toBe('veg-vegan-starters')
    expect(dishes[0].needsRefill).toBe(false)
  })

  it('filters admin rows by refill status', () => {
    const dishes: BuffetDish[] = [
      {
        menuItemId: 'veg-samosa',
        name: 'Samosa',
        isVegetarian: true,
        isNew: false,
        sortOrder: 0,
        isServing: true,
        needsRefill: true,
      },
      {
        menuItemId: 'butter-chicken',
        name: 'Butter Chicken',
        isVegetarian: false,
        isNew: false,
        sortOrder: 1,
        isServing: true,
        needsRefill: false,
      },
    ]

    const menuItems = [
      { id: 'veg-samosa', name: 'Samosa', category: 'appetizers', isVegetarian: true } as const,
      { id: 'butter-chicken', name: 'Butter Chicken', category: 'chicken', isVegetarian: false } as const,
    ]

    const red = buildAdminBuffetSections([...menuItems], dishes, '', 'red')
    const redIds = [...red.sections.flatMap((s) => s.rows), ...red.extraRows].map((r) => r.menuItemId)
    expect(redIds).toEqual(['veg-samosa'])

    const allRows = buildAdminBuffetSections([...menuItems], dishes)
    const counts = countAdminBuffetRefillStatus([
      ...allRows.sections.flatMap((s) => s.rows),
      ...allRows.extraRows,
    ])
    expect(counts).toEqual({ all: 2, green: 1, red: 1 })
  })
})
