import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import { MenuItem } from '../../types/menu'
import { DEFAULT_LOCATION_ID } from '../../constants/config'
import {
  getStaticMenuCatalog,
  mergeMenuItems,
  sortMenuItems,
  withLocationAvailability,
} from '../menuMerge'
import { resolveMenuItemImage } from '../menuImages'

function ensureImage(item: MenuItem): MenuItem {
  return {
    ...item,
    imageURL: resolveMenuItemImage(item),
  }
}

export async function fetchAdminMenuItems(locationId: string = DEFAULT_LOCATION_ID): Promise<MenuItem[]> {
  const staticItems = getStaticMenuCatalog(locationId, { includeUnavailable: true })

  if (!isFirebaseConfigured) {
    return sortMenuItems(staticItems.map((item) => withLocationAvailability(item, locationId)))
  }

  try {
    const snap = await getDocs(collection(db, 'menu'))
    if (snap.empty) {
      return sortMenuItems(staticItems.map((item) => withLocationAvailability(item, locationId)))
    }

    const remoteItems = snap.docs.map((d) =>
      ensureImage({ id: d.id, ...d.data() } as MenuItem),
    )
    return sortMenuItems(
      mergeMenuItems(staticItems, remoteItems).map((item) =>
        withLocationAvailability(item, locationId),
      ),
    )
  } catch {
    return sortMenuItems(staticItems.map((item) => withLocationAvailability(item, locationId)))
  }
}

export async function saveMenuItem(itemId: string, patch: Partial<MenuItem>, base?: MenuItem) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured')
  }

  const staticBase =
    base ??
    getStaticMenuCatalog(DEFAULT_LOCATION_ID, { includeUnavailable: true }).find(
      (i) => i.id === itemId,
    )
  if (!staticBase) throw new Error('Menu item not found')

  const payload = {
    ...staticBase,
    ...patch,
    id: itemId,
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'menu', itemId), payload, { merge: true })
}

export async function setMenuAvailability(
  itemId: string,
  isAvailable: boolean,
  locationId: string,
  base?: MenuItem,
) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured')
  }

  const ref = doc(db, 'menu', itemId)
  const staticBase =
    base ??
    getStaticMenuCatalog(DEFAULT_LOCATION_ID, { includeUnavailable: true }).find(
      (i) => i.id === itemId,
    )

  const locationStock = {
    ...(staticBase?.locationStock ?? base?.locationStock ?? {}),
    [locationId]: {
      ...(staticBase?.locationStock?.[locationId] ?? base?.locationStock?.[locationId] ?? {}),
      isAvailable,
    },
  }

  if (staticBase) {
    await setDoc(
      ref,
      { ...staticBase, locationStock, updatedAt: serverTimestamp() },
      { merge: true },
    )
    return
  }

  await updateDoc(ref, { locationStock, updatedAt: serverTimestamp() })
}

export async function setMenuStock(
  itemId: string,
  stockQty: number | null,
  trackStock: boolean,
  locationId: string,
  base?: MenuItem,
) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured')
  }

  const isAvailable = !trackStock || stockQty === null || stockQty > 0
  const locationStock = {
    ...(base?.locationStock ?? {}),
    [locationId]: {
      ...(base?.locationStock?.[locationId] ?? {}),
      trackStock,
      stockQty,
      isAvailable,
    },
  }

  await saveMenuItem(
    itemId,
    {
      trackStock,
      stockQty,
      stockThreshold: base?.stockThreshold ?? 5,
      isAvailable,
      locationStock,
    },
    base,
  )
}
