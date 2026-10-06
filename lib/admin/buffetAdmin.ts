import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { BUFFET_DAYS, BUFFET_MEALS } from '../../constants/buffet'
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
    // Informational only — the site prices and schedules the buffet from constants/buffetSchedule.ts.
    weekdayLunchPrice: BUFFET_MEALS.lunch.regularPriceCents,
    weekdayDinnerPrice: BUFFET_MEALS.dinner.regularPriceCents,
    weekendLunchPrice: BUFFET_MEALS.lunch.regularPriceCents,
    weekendDinnerPrice: BUFFET_MEALS.dinner.regularPriceCents,
    lunchStart: BUFFET_MEALS.lunch.start,
    lunchEnd: BUFFET_MEALS.lunch.end,
    dinnerStart: BUFFET_MEALS.dinner.start,
    dinnerEnd: BUFFET_MEALS.dinner.end,
    buffetDays: BUFFET_DAYS,
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
