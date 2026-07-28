import { normalizeLocationId } from './locationIds'

export interface CloverLocationConfig {
  locationId: string
  merchantId: string
  privateKey: string
  webhookSecret: string
  pageConfigUuid?: string
}

const KNOWN_LOCATION_IDS = ['chicago-il'] as const

function locationIdToEnvPrefix(locationId: string): string {
  return locationId.replace(/-/g, '_').toUpperCase()
}

function readLocationFromEnvVars(locationId: string): CloverLocationConfig | null {
  const prefix = `CLOVER_LOCATION_${locationIdToEnvPrefix(locationId)}`
  const merchantId = process.env[`${prefix}_MERCHANT_ID`]?.trim()
  const privateKey = process.env[`${prefix}_PRIVATE_KEY`]?.trim()
  const webhookSecret = process.env[`${prefix}_WEBHOOK_SECRET`]?.trim()

  if (!merchantId || !privateKey || !webhookSecret) {
    return null
  }

  return {
    locationId,
    merchantId,
    privateKey,
    webhookSecret,
    pageConfigUuid: process.env[`${prefix}_PAGE_CONFIG_UUID`]?.trim() || undefined,
  }
}

function readLocationsFromJson(): CloverLocationConfig[] {
  const raw = process.env.CLOVER_LOCATIONS_JSON?.trim()
  if (!raw) {
    return []
  }

  let parsed: Record<
    string,
    {
      merchantId?: string
      privateKey?: string
      webhookSecret?: string
      pageConfigUuid?: string
    }
  >

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('CLOVER_LOCATIONS_JSON is not valid JSON')
  }

  return Object.entries(parsed)
    .map(([locationId, value]) => {
      const merchantId = value.merchantId?.trim()
      const privateKey = value.privateKey?.trim()
      const webhookSecret = value.webhookSecret?.trim()
      if (!merchantId || !privateKey || !webhookSecret) {
        throw new Error(
          `CLOVER_LOCATIONS_JSON entry "${locationId}" must include merchantId, privateKey, and webhookSecret`,
        )
      }
      return {
        locationId,
        merchantId,
        privateKey,
        webhookSecret,
        pageConfigUuid: value.pageConfigUuid?.trim() || undefined,
      }
    })
}

function readLegacySingleLocation(): CloverLocationConfig[] {
  const merchantId = process.env.CLOVER_MERCHANT_ID?.trim()
  const privateKey = process.env.CLOVER_PRIVATE_KEY?.trim()
  const webhookSecret = process.env.CLOVER_WEBHOOK_SECRET?.trim()
  if (!merchantId || !privateKey || !webhookSecret) {
    return []
  }

  return [
    {
      locationId: process.env.CLOVER_DEFAULT_LOCATION_ID?.trim() || 'chicago-il',
      merchantId,
      privateKey,
      webhookSecret,
      pageConfigUuid: process.env.CLOVER_PAGE_CONFIG_UUID?.trim() || undefined,
    },
  ]
}

let cachedLocations: CloverLocationConfig[] | null = null

export function getCloverLocations(): CloverLocationConfig[] {
  if (cachedLocations) {
    return cachedLocations
  }

  const fromJson = readLocationsFromJson()
  if (fromJson.length > 0) {
    cachedLocations = fromJson
    return cachedLocations
  }

  const fromPrefixedEnv = KNOWN_LOCATION_IDS.map(readLocationFromEnvVars).filter(
    (location): location is CloverLocationConfig => location !== null,
  )
  if (fromPrefixedEnv.length > 0) {
    cachedLocations = fromPrefixedEnv
    return cachedLocations
  }

  const legacy = readLegacySingleLocation()
  cachedLocations = legacy
  return cachedLocations
}

export function getCloverLocationConfig(locationId: string): CloverLocationConfig {
  const normalizedLocationId = normalizeLocationId(locationId)
  const locations = getCloverLocations()
  const match = locations.find((location) => location.locationId === normalizedLocationId)
  if (!match) {
    const available = locations.map((location) => location.locationId).join(', ') || 'none'
    throw new Error(`Clover is not configured for location "${normalizedLocationId}". Available: ${available}`)
  }
  return match
}

export function getCloverLocationByMerchantId(merchantId: string): CloverLocationConfig | null {
  const locations = getCloverLocations()
  return locations.find((location) => location.merchantId === merchantId) ?? null
}

/** All signing secrets for a merchant (each Hosted Checkout page can have its own). */
export function getCloverWebhookSecretsForMerchant(merchantId: string): string[] {
  const secrets = new Set<string>()
  for (const location of getCloverLocations()) {
    if (location.merchantId === merchantId && location.webhookSecret) {
      secrets.add(location.webhookSecret)
    }
  }
  return [...secrets]
}

/** Every configured webhook signing secret (small list — used as verification fallback). */
export function getAllCloverWebhookSecrets(): string[] {
  const secrets = new Set<string>()
  for (const location of getCloverLocations()) {
    if (location.webhookSecret) secrets.add(location.webhookSecret)
  }
  return [...secrets]
}

export function assertAnyCloverLocationConfigured(): void {
  if (getCloverLocations().length === 0) {
    throw new Error(
      'No Clover locations configured. Set CLOVER_LOCATIONS_JSON or CLOVER_LOCATION_* env vars.',
    )
  }
}
