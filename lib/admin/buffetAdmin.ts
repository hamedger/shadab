import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { BUFFET_PRICING } from '../../constants/buffet'
import { createDefaultBuffetDishes } from '../buffetLayout'
import { db } from '../firebase'
import { locationIdsForFirestoreQuery, normalizeLocationId } from '../locationUtils'
import { BuffetConfig } from '../../types/buffet'
import { MenuItem } from '../../types/menu'

export function defaultBuffetConfigFields(
  locationId: string,
  menuItems: Pick<MenuItem, 'id' | 'isVegetarian'>[],
): Omit<BuffetConfig, 'updatedAt'> {
  const canonical = normalizeLocationId(locationId)
  return {
    locationId: canonical,
    weekdayLunchPrice: BUFFET_PRICING.weekday.lunch,
    weekdayDinnerPrice: BUFFET_PRICING.weekday.dinner,
    weekendLunchPrice: BUFFET_PRICING.weekend.lunch,
    weekendDinnerPrice: BUFFET_PRICING.weekend.dinner,
    lunchStart: '11:00',
    lunchEnd: '15:00',
    dinnerStart: '17:00',
    dinnerEnd: '21:00',
    buffetDays: [1, 2, 3, 4, 5, 6],
    todaysDishes: createDefaultBuffetDishes(menuItems),
    isLunchActive: false,
    isDinnerActive: false,
    specialNote: '',
  }
}

/** Prefer an existing buffet doc (canonical or legacy id). */
export async function resolveBuffetDocId(locationId: string): Promise<string> {
  for (const id of locationIdsForFirestoreQuery(locationId)) {
    const snap = await getDoc(doc(db, 'buffet', id))
    if (snap.exists()) return id
  }
  return normalizeLocationId(locationId)
}

export async function ensureBuffetConfig(
  buffetDocId: string,
  locationId: string,
  menuItems: Pick<MenuItem, 'id' | 'isVegetarian'>[],
  current: BuffetConfig | null,
): Promise<BuffetConfig> {
  if (current) return current

  const fields = defaultBuffetConfigFields(locationId, menuItems)
  await setDoc(
    doc(db, 'buffet', buffetDocId),
    { ...fields, updatedAt: serverTimestamp() },
    { merge: false },
  )
  return fields as BuffetConfig
}
