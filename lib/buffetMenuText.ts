import { BuffetDish } from '../types/buffet'
import { BUFFET_MEAL_ORDER, BuffetMeal } from '../constants/buffetSchedule'

export type BuffetMenuLine = { kind: 'heading' | 'item'; text: string }

const BULLET = /^\s*(?:[-–—•*·▪●◦]+|\d+[.)])\s*/

/** A heading is a line ending in ":" or written in capitals (e.g. "CHICKEN", "Desserts:"). */
function isHeading(line: string): boolean {
  if (line.endsWith(':')) return true
  const letters = line.replace(/[^A-Za-z]/g, '')
  return letters.length >= 3 && letters === letters.toUpperCase() && !BULLET.test(line)
}

/** Pasted menu → display lines, in order, blank lines dropped. Text is kept as pasted. */
export function parseBuffetMenuText(text: string): BuffetMenuLine[] {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => ({ kind: isHeading(line) ? 'heading' : 'item', text: line }))
}

function dishName(line: string): string {
  return line.replace(BULLET, '').replace(/\s+/g, ' ').trim()
}

/** Stable id for a pasted dish so its refill state survives re-uploads of the same menu. */
export function buffetMenuDishId(meal: BuffetMeal, name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `menu-${meal}-${slug || 'dish'}`
}

/** Dish lines of a pasted menu (headings excluded), de-duplicated, in menu order. */
export function buffetMenuDishes(meal: BuffetMeal, text: string): { id: string; name: string }[] {
  const seen = new Set<string>()
  const dishes: { id: string; name: string }[] = []
  for (const line of parseBuffetMenuText(text)) {
    if (line.kind !== 'item') continue
    const name = dishName(line.text)
    if (!name) continue
    const id = buffetMenuDishId(meal, name)
    if (seen.has(id)) continue
    seen.add(id)
    dishes.push({ id, name })
  }
  return dishes
}

/**
 * The refill line after uploading one meal's menu. That meal's dishes are rebuilt from the text —
 * dishes already on the line keep their refill state, new ones start stocked. Other meals' dishes
 * are untouched; legacy dishes from before per-meal menus (no `meal`) are dropped. Every dropped
 * dish is returned in `removed` so open refills can be closed.
 */
export function syncRefillLineWithMenu(
  current: BuffetDish[],
  meal: BuffetMeal,
  text: string,
): { next: BuffetDish[]; removed: BuffetDish[] } {
  const byId = new Map(current.map((d) => [d.menuItemId, d]))
  const dishes = buffetMenuDishes(meal, text)
  const keep = new Set(dishes.map((d) => d.id))
  const mealDishes = dishes.map(({ id, name }, sortOrder): BuffetDish => {
    const existing = byId.get(id)
    return existing
      ? { ...existing, name, sortOrder, meal }
      : {
          menuItemId: id,
          name,
          isVegetarian: false,
          isNew: false,
          sortOrder,
          isServing: true,
          needsRefill: false,
          meal,
        }
  })
  const others = current.filter((d) => d.meal && d.meal !== meal)
  const removed = current.filter((d) => (d.meal === meal && !keep.has(d.menuItemId)) || !d.meal)
  const order = (m?: BuffetMeal) => (m ? BUFFET_MEAL_ORDER.indexOf(m) : 99)
  const next = [...others, ...mealDishes].sort(
    (a, b) => order(a.meal) - order(b.meal) || a.sortOrder - b.sortOrder,
  )
  return { next, removed }
}
