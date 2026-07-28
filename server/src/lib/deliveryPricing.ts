export const FREE_DELIVERY_RADIUS_MILES = 1
export const DELIVERY_RATE_CENTS_PER_MILE = 100
export const MAX_DELIVERY_RADIUS_MILES = 10
export const DELIVERY_MINIMUM_SUBTOTAL_CENTS = 2000

// TODO: replace with the real restaurant coordinates once the address is confirmed
export const STORE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'chicago-il': { lat: 41.878113, lng: -87.629799 },
}

export interface DeliveryAddressInput {
  street: string
  city: string
  state?: string
  zip: string
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const earthRadiusMiles = 3958.8
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusMiles * c
}

export function feeCentsForDistance(distanceMiles: number): number {
  if (distanceMiles <= FREE_DELIVERY_RADIUS_MILES) return 0
  return Math.round(distanceMiles * DELIVERY_RATE_CENTS_PER_MILE)
}

/** Free US Census geocoder — no API key required, US addresses only. */
export async function geocodeAddress(
  address: DeliveryAddressInput,
): Promise<{ lat: number; lng: number }> {
  const oneLine = `${address.street.trim()}, ${address.city.trim()}, ${(address.state ?? 'MI').trim()} ${address.zip.trim()}`
  const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress')
  url.searchParams.set('address', oneLine)
  url.searchParams.set('benchmark', 'Public_AR_Current')
  url.searchParams.set('format', 'json')

  let resp: Response
  try {
    resp = await fetch(url.toString())
  } catch {
    throw new Error('Could not verify that delivery address. Please try again.')
  }

  if (!resp.ok) {
    throw new Error('Could not verify that delivery address. Please try again.')
  }

  const data = (await resp.json()) as {
    result?: { addressMatches?: { coordinates?: { x?: number; y?: number } }[] }
  }
  const match = data.result?.addressMatches?.[0]
  const lng = match?.coordinates?.x
  const lat = match?.coordinates?.y
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error("We couldn't locate that address. Please double-check it and try again.")
  }

  return { lat, lng }
}

export async function computeDeliveryFee(input: {
  locationId: string
  deliveryAddress: DeliveryAddressInput
}): Promise<{ feeCents: number; distanceMiles: number }> {
  const store = STORE_COORDINATES[input.locationId] ?? STORE_COORDINATES['chicago-il']
  const dropoff = await geocodeAddress(input.deliveryAddress)
  const distanceMiles = haversineMiles(store.lat, store.lng, dropoff.lat, dropoff.lng)

  if (distanceMiles > MAX_DELIVERY_RADIUS_MILES) {
    throw new Error(
      `That address is outside our ${MAX_DELIVERY_RADIUS_MILES}-mile delivery range. Please choose pickup instead.`,
    )
  }

  return { feeCents: feeCentsForDistance(distanceMiles), distanceMiles }
}
