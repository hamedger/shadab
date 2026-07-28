import { BUFFET_SECTIONS, BuffetSectionId, getBuffetDisplayName, getBuffetSectionId } from '../constants/buffetLayout'
import { BuffetDish } from '../types/buffet'
import { MenuItem } from '../types/menu'
import { isBuffetDishNeedsRefill, isBuffetDishServing } from './services/buffetService'

export interface BuffetSectionGroup {
  id: BuffetSectionId
  title: string
  dishes: BuffetDish[]
}

export interface AdminBuffetRow {
  menuItemId: string
  displayName: string
  menuItem?: MenuItem
  buffetDish?: BuffetDish
}

export interface AdminBuffetSectionGroup {
  id: BuffetSectionId
  title: string
  rows: AdminBuffetRow[]
}

function enrichDishName(dish: BuffetDish): BuffetDish {
  return {
    ...dish,
    name: getBuffetDisplayName(dish.menuItemId, dish.name),
  }
}

function sortForCustomerDisplay(dishes: BuffetDish[], sectionId: BuffetSectionId): BuffetDish[] {
  const sorted = sortByLayoutOrder(dishes, sectionId)
  const serving = sorted.filter(isBuffetDishServing)
  const paused = sorted.filter((d) => !isBuffetDishServing(d))
  return [...serving, ...paused]
}

function sortByLayoutOrder(dishes: BuffetDish[], sectionId: BuffetSectionId): BuffetDish[] {
  const section = BUFFET_SECTIONS.find((s) => s.id === sectionId)
  if (!section) {
    return [...dishes].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  }

  const order = new Map<string, number>(section.items.map((item, index) => [item.menuItemId, index]))
  return [...dishes].sort((a, b) => {
    const ao = order.get(a.menuItemId) ?? 999
    const bo = order.get(b.menuItemId) ?? 999
    if (ao !== bo) return ao - bo
    return a.name.localeCompare(b.name)
  })
}

/** Group today's buffet dishes for the customer page (layout order; paused dishes last). */
export function groupBuffetDishesForCustomer(dishes: BuffetDish[]): BuffetSectionGroup[] {
  const enriched = dishes.map(enrichDishName)
  const byId = new Map(enriched.map((d) => [d.menuItemId, d]))
  const used = new Set<string>()
  const groups: BuffetSectionGroup[] = []

  for (const section of BUFFET_SECTIONS) {
    const sectionDishes = section.items
      .map((item) => byId.get(item.menuItemId))
      .filter((d): d is BuffetDish => !!d)

    sectionDishes.forEach((d) => used.add(d.menuItemId))
    if (sectionDishes.length > 0) {
      groups.push({
        id: section.id,
        title: section.title,
        dishes: sortForCustomerDisplay(sectionDishes, section.id),
      })
    }
  }

  const other = sortForCustomerDisplay(
    enriched.filter((d) => !used.has(d.menuItemId)),
    'other',
  )
  if (other.length > 0) {
    groups.push({ id: 'other', title: 'Other', dishes: other })
  }

  return groups
}

export type AdminBuffetStatusFilter = 'all' | 'green' | 'red'

function matchesSearch(row: AdminBuffetRow, query: string): boolean {
  if (!query) return true
  const haystack = `${row.displayName} ${row.menuItem?.name ?? ''} ${row.menuItem?.category ?? ''}`.toLowerCase()
  return haystack.includes(query)
}

function matchesStatusFilter(row: AdminBuffetRow, filter: AdminBuffetStatusFilter): boolean {
  if (filter === 'all') return true
  if (!row.buffetDish) return false
  const needsRefill = isBuffetDishNeedsRefill(row.buffetDish)
  return filter === 'red' ? needsRefill : !needsRefill
}

export function countAdminBuffetRefillStatus(rows: AdminBuffetRow[]): {
  all: number
  green: number
  red: number
} {
  const onBuffet = rows.filter((r) => r.buffetDish)
  return {
    all: onBuffet.length,
    green: onBuffet.filter((r) => r.buffetDish && !isBuffetDishNeedsRefill(r.buffetDish)).length,
    red: onBuffet.filter((r) => r.buffetDish && isBuffetDishNeedsRefill(r.buffetDish)).length,
  }
}

/** Build grouped admin rows — layout order, includes items not yet on buffet. */
export function buildAdminBuffetSections(
  menuItems: MenuItem[],
  todaysDishes: BuffetDish[],
  search = '',
  statusFilter: AdminBuffetStatusFilter = 'all',
): { sections: AdminBuffetSectionGroup[]; extraRows: AdminBuffetRow[] } {
  const menuById = new Map(menuItems.map((i) => [i.id, i]))
  const dishById = new Map(todaysDishes.map((d) => [d.menuItemId, d]))
  const query = search.trim().toLowerCase()
  const layoutIds = new Set<string>()

  const sections: AdminBuffetSectionGroup[] = BUFFET_SECTIONS.map((section) => {
    const rows: AdminBuffetRow[] = []
    for (const item of section.items) {
      layoutIds.add(item.menuItemId)
      const row: AdminBuffetRow = {
        menuItemId: item.menuItemId,
        displayName: item.displayName,
        menuItem: menuById.get(item.menuItemId),
        buffetDish: dishById.get(item.menuItemId),
      }
      if (matchesSearch(row, query) && matchesStatusFilter(row, statusFilter)) rows.push(row)
    }
    return { id: section.id, title: section.title, rows }
  }).filter((s) => s.rows.length > 0 || (!query && statusFilter === 'all'))

  const extraRows: AdminBuffetRow[] = menuItems
    .filter((item) => !layoutIds.has(item.id))
    .map((item) => ({
      menuItemId: item.id,
      displayName: getBuffetDisplayName(item.id, item.name),
      menuItem: item,
      buffetDish: dishById.get(item.id),
    }))
    .filter((row) => matchesSearch(row, query) && matchesStatusFilter(row, statusFilter))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))

  return { sections, extraRows }
}

export function buffetDishFromMenuItem(item: MenuItem, sortOrder: number): BuffetDish {
  return {
    menuItemId: item.id,
    name: getBuffetDisplayName(item.id, item.name),
    isVegetarian: item.isVegetarian,
    isNew: false,
    sortOrder,
    isServing: true,
    needsRefill: false,
    buffetCategory: getBuffetSectionId(item.id),
  }
}

/** Default today's dishes for seeding — all layout items that exist in the static menu. */
export function createDefaultBuffetDishes(
  menuItems: Pick<MenuItem, 'id' | 'isVegetarian'>[],
): BuffetDish[] {
  const menuById = new Map(menuItems.map((m) => [m.id, m]))
  const dishes: BuffetDish[] = []
  let sortOrder = 0

  for (const section of BUFFET_SECTIONS) {
    for (const item of section.items) {
      const menuItem = menuById.get(item.menuItemId)
      if (!menuItem) continue
      dishes.push({
        menuItemId: item.menuItemId,
        name: item.displayName,
        isVegetarian: menuItem.isVegetarian,
        isNew: false,
        sortOrder: sortOrder++,
        isServing: true,
        needsRefill: false,
        buffetCategory: section.id,
      })
    }
  }

  return dishes
}
