import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import { buildWeeklyLocationHours, DEFAULT_LOCATION_ID, DEFAULT_PICKUP_PREP_BUFFER_MINUTES, LOCATION_DINE_IN_HOURS } from '../../constants/config'
import { Location, LocationInput } from '../../types/location'
import { slugifyLocationId } from '../locationUtils'

function defaultLocationPayload(id: string, input: Partial<LocationInput>): Location {
  return {
    id,
    name: input.name?.trim() ?? 'New Location',
    address: {
      street: input.address?.street?.trim() ?? '',
      city: input.address?.city?.trim() ?? '',
      state: input.address?.state?.trim() ?? 'IL',
      zip: input.address?.zip?.trim() ?? '',
      country: input.address?.country?.trim() ?? 'US',
    },
    phone: input.phone?.trim() ?? '',
    website: input.website?.trim() ?? '',
    hours:
      input.hours ??
      buildWeeklyLocationHours(
        LOCATION_DINE_IN_HOURS[DEFAULT_LOCATION_ID].open,
        LOCATION_DINE_IN_HOURS[DEFAULT_LOCATION_ID].close,
      ),
    isActive: input.isActive ?? true,
    acceptsDelivery: input.acceptsDelivery ?? true,
    acceptsPickup: input.acceptsPickup ?? true,
    acceptsReservations: input.acceptsReservations ?? true,
    acceptsCatering: input.acceptsCatering ?? true,
    deliveryRadius: input.deliveryRadius ?? 10,
    timezone: input.timezone ?? 'America/Chicago',
    pickupPrepBufferMinutes: input.pickupPrepBufferMinutes ?? DEFAULT_PICKUP_PREP_BUFFER_MINUTES,
  }
}

export function buildLocationId(input: Pick<LocationInput, 'id' | 'name' | 'address'>): string {
  if (input.id?.trim()) return input.id.trim().toLowerCase()
  return slugifyLocationId(
    input.name ?? '',
    input.address?.city ?? '',
    input.address?.state ?? 'IL',
  )
}

export async function enableMenuAtLocation(locationId: string): Promise<void> {
  if (!isFirebaseConfigured) return

  const snap = await getDocs(collection(db, 'menu'))
  if (snap.empty) return

  const batch = writeBatch(db)
  let writes = 0

  for (const menuDoc of snap.docs) {
    const data = menuDoc.data()
    const locationIds: string[] = Array.isArray(data.locationIds) ? data.locationIds : []
    if (locationIds.includes(locationId)) continue
    batch.update(menuDoc.ref, {
      locationIds: [...locationIds, locationId],
      updatedAt: serverTimestamp(),
    })
    writes += 1
  }

  if (writes > 0) await batch.commit()
}

export async function saveLocation(input: LocationInput): Promise<string> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured')

  const id = buildLocationId(input)
  if (!id) throw new Error('Location ID is required')

  const existingSnap = await getDoc(doc(db, 'locations', id))
  const isNew = !existingSnap.exists()

  const payload = defaultLocationPayload(id, input)
  await setDoc(doc(db, 'locations', id), {
    ...payload,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true })

  if (isNew) {
    await enableMenuAtLocation(id)
  }

  return id
}

export async function updateLocation(locationId: string, patch: Partial<LocationInput>): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured')

  await updateDoc(doc(db, 'locations', locationId), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}
