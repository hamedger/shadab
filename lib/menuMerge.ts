import { MenuItem } from '../types/menu'
import { STATIC_MENU } from '../constants/staticMenu'
import { DEFAULT_LOCATION_ID } from '../constants/config'
import { resolveMenuItemImage } from './menuImages'

export function getMenuItemAvailability(item: MenuItem, locationId: string): boolean {
  const override = item.locationStock?.[locationId]?.isAvailable
  if (override !== undefined) return override
  return item.isAvailable !== false
}

export function withLocationAvailability(item: MenuItem, locationId: string): MenuItem {
  return {
    ...item,
    isAvailable: getMenuItemAvailability(item, locationId),
  }
}

export function isMenuItemOrderable(item: MenuItem, locationId?: string): boolean {
  if (locationId) return getMenuItemAvailability(item, locationId)
  return item.isAvailable !== false
}

/** Shared-menu rule: items at the flagship store are offered at new locations until restricted. */
export function itemAvailableAtLocation(item: MenuItem, locationId: string): boolean {
  const ids = item.locationIds ?? []
  if (ids.length === 0) return true
  if (ids.includes(locationId)) return true
  if (locationId !== DEFAULT_LOCATION_ID && ids.includes(DEFAULT_LOCATION_ID)) return true
  return false
}

function ensureImage(item: MenuItem): MenuItem {
  return {
    ...item,
    imageURL: resolveMenuItemImage(item),
  }
}

export function getStaticMenuCatalog(
  locationId: string = DEFAULT_LOCATION_ID,
  opts?: { category?: string; includeUnavailable?: boolean },
): MenuItem[] {
  return (STATIC_MENU as MenuItem[])
    .filter((i) => {
      if (!itemAvailableAtLocation(i, locationId)) return false
      if (!opts?.includeUnavailable && !i.isAvailable) return false
      if (opts?.category && i.category !== opts.category) return false
      return true
    })
    .map(ensureImage)
}

/** Retired items; legacy Firestore docs may still exist under alternate ids. */
export const REMOVED_MENU_IDS = new Set(['sheek-kabab', 'sheekh-kabab'])

/** Legacy Firestore doc ids merged into the canonical static-menu id. */
const LEGACY_MENU_ID_ALIASES: Record<string, string> = {
  'goat-karahi': 'lamb-karahi',
}

function isRemovedMenuItem(id: string): boolean {
  return REMOVED_MENU_IDS.has(id)
}

function normalizeRemoteMenuItem(item: MenuItem): MenuItem {
  const canonicalId = LEGACY_MENU_ID_ALIASES[item.id]
  return canonicalId ? { ...item, id: canonicalId } : item
}

/** Static base + Firestore overrides (Firestore wins on conflict). */
export function mergeMenuItems(staticItems: MenuItem[], remoteItems: MenuItem[]): MenuItem[] {
  const remoteMap = new Map(
    remoteItems
      .map((i) => normalizeRemoteMenuItem(i))
      .filter((i) => !isRemovedMenuItem(i.id))
      .map((i) => [i.id, i] as const),
  )

  const merged = staticItems
    .filter((item) => !isRemovedMenuItem(item.id))
    .map((item) => {
      const remote = remoteMap.get(item.id)
      return remote ? { ...item, ...remote, id: item.id } : item
    })

  for (const [id, remote] of remoteMap) {
    if (!staticItems.some((s) => s.id === id)) {
      merged.push(remote)
    }
  }

  return merged
}

export function filterMenuForDisplay(
  items: MenuItem[],
  locationId: string = DEFAULT_LOCATION_ID,
  category?: string,
): MenuItem[] {
  return items
    .map((item) => withLocationAvailability(item, locationId))
    .filter((i) => itemAvailableAtLocation(i, locationId))
    .filter((i) => isMenuItemOrderable(i, locationId))
    .filter((i) => !category || i.category === category)
    .sort((a, b) => {
      const avail = Number(isMenuItemOrderable(b, locationId)) - Number(isMenuItemOrderable(a, locationId))
      if (avail !== 0) return avail
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
    })
}

export function sortMenuItems(items: MenuItem[]): MenuItem[] {
  return [...items].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  )
}
