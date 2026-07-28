import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { MenuItem } from '../types/menu'
import { DEFAULT_LOCATION_ID } from '../constants/config'
import {
  filterMenuForDisplay,
  getStaticMenuCatalog,
  mergeMenuItems,
  REMOVED_MENU_IDS,
  withLocationAvailability,
} from '../lib/menuMerge'
import { STATIC_MENU } from '../constants/staticMenu'
import { resolveMenuItemImage } from '../lib/menuImages'

function ensureImage(item: MenuItem): MenuItem {
  return {
    ...item,
    imageURL: resolveMenuItemImage(item),
  }
}

/** @deprecated use getStaticMenuCatalog from lib/menuMerge */
export function getStaticMenuItems(
  locationId: string = DEFAULT_LOCATION_ID,
  category?: string,
): MenuItem[] {
  return getStaticMenuCatalog(locationId, { category })
}

async function fetchMenuItems(
  locationId: string = DEFAULT_LOCATION_ID,
  category?: string,
): Promise<MenuItem[]> {
  const staticItems = getStaticMenuCatalog(locationId, { category })

  if (!isFirebaseConfigured) return staticItems

  try {
    const snap = await getDocs(collection(db, 'menu'))
    if (snap.empty) return staticItems

    const remoteItems = snap.docs.map((d) =>
      ensureImage({ id: d.id, ...d.data() } as MenuItem),
    )
    const merged = mergeMenuItems(staticItems, remoteItems).map(ensureImage)
    return filterMenuForDisplay(merged, locationId, category)
  } catch {
    return staticItems
  }
}

export function useMenu(locationId: string = DEFAULT_LOCATION_ID, category?: string) {
  return useQuery({
    queryKey: ['menu', locationId, category],
    queryFn: () => fetchMenuItems(locationId, category),
    placeholderData: () => getStaticMenuCatalog(locationId, { category }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useMenuItem(itemId: string, locationId: string = DEFAULT_LOCATION_ID) {
  return useQuery({
    queryKey: ['menuItem', itemId, locationId],
    queryFn: async () => {
      if (REMOVED_MENU_IDS.has(itemId)) throw new Error('Item not found')

      const staticItem = STATIC_MENU.find((i) => i.id === itemId)
      if (!isFirebaseConfigured) {
        if (!staticItem) throw new Error('Item not found')
        return withLocationAvailability(ensureImage(staticItem as MenuItem), locationId)
      }
      try {
        const { getDoc, doc } = await import('firebase/firestore')
        const snap = await getDoc(doc(db, 'menu', itemId))
        if (snap.exists()) {
          const remote = ensureImage({ id: snap.id, ...snap.data() } as MenuItem)
          if (staticItem) {
            return withLocationAvailability(
              ensureImage({ ...staticItem, ...remote, id: itemId } as MenuItem),
              locationId,
            )
          }
          return withLocationAvailability(remote, locationId)
        }
      } catch {
        // fall through to static lookup
      }
      if (!staticItem) throw new Error('Item not found')
      return withLocationAvailability(ensureImage(staticItem as MenuItem), locationId)
    },
  })
}
