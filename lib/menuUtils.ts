import { MenuItem } from '../types/menu'
import { MENU_CATEGORIES } from '../constants/menu'
import { spacing } from '../constants/theme'

export function getMenuColumnCount(width: number): number {
  if (width >= 1200) return 6
  if (width >= 900) return 5
  if (width >= 600) return 4
  return 3
}

export function getMenuCardWidth(
  width: number,
  gridPad = spacing.md,
  gridGap = spacing.sm,
): number {
  const numCols = getMenuColumnCount(width)
  return (width - gridPad * 2 - gridGap * (numCols - 1)) / numCols
}

export type MenuQuickFilter = 'all' | 'bestseller' | 'vegetarian' | 'signature'

export interface MenuSection {
  categoryId: string
  categoryLabel: string
  items: MenuItem[]
}

export function filterMenuItems(
  items: MenuItem[],
  opts: {
    search: string
    categoryId: string | null
    quickFilter: MenuQuickFilter
  },
): MenuItem[] {
  let result = items

  if (opts.categoryId) {
    result = result.filter((i) => i.category === opts.categoryId)
  }

  if (opts.quickFilter === 'bestseller') {
    result = result.filter((i) => i.tags.includes('bestseller'))
  } else if (opts.quickFilter === 'vegetarian') {
    result = result.filter((i) => i.isVegetarian)
  } else if (opts.quickFilter === 'signature') {
    result = result.filter((i) => i.tags.includes('signature'))
  }

  if (opts.search.trim()) {
    const q = opts.search.trim().toLowerCase()
    result = result.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
    )
  }

  return result
}

export function groupMenuByCategory(items: MenuItem[]): MenuSection[] {
  const byCategory = new Map<string, MenuItem[]>()
  for (const item of items) {
    const list = byCategory.get(item.category) ?? []
    list.push(item)
    byCategory.set(item.category, list)
  }

  return MENU_CATEGORIES.filter((cat) => (byCategory.get(cat.id)?.length ?? 0) > 0).map(
    (cat) => ({
      categoryId: cat.id,
      categoryLabel: cat.label,
      items: byCategory.get(cat.id) ?? [],
    }),
  )
}

export function shouldGroupSections(
  categoryId: string | null,
  search: string,
  quickFilter: MenuQuickFilter,
): boolean {
  return !categoryId && !search.trim() && quickFilter === 'all'
}

export function getCategoryLabel(categoryId: string): string {
  return MENU_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId
}
