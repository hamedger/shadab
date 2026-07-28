export const DEFAULT_LOCATION_ID = 'chicago-il'

const LOCATION_ID_ALIASES: Record<string, string> = {}

const LOCATION_LABELS: Record<string, string> = {
  'chicago-il': 'Chicago',
}

export function normalizeLocationId(locationId: string): string {
  const trimmed = locationId.trim()
  if (!trimmed) return ''
  const key = trimmed.toLowerCase()
  return LOCATION_ID_ALIASES[key] ?? trimmed
}

export function getLocationLabel(locationId: string): string {
  const normalized = normalizeLocationId(locationId)
  return LOCATION_LABELS[normalized] ?? normalized
}

/** Prefer stored locationId; normalize legacy ids; infer from Clover merchant when missing. */
export function resolveOrderLocationId(order: {
  locationId?: unknown
  cloverMerchantId?: unknown
}): string {
  const raw = String(order.locationId ?? '').trim()
  const normalized = normalizeLocationId(raw)
  if (normalized && LOCATION_LABELS[normalized]) {
    return normalized
  }

  const merchantId = String(order.cloverMerchantId ?? '').trim()
  if (merchantId) {
    for (const id of Object.keys(LOCATION_LABELS)) {
      const prefix = `CLOVER_LOCATION_${id.replace(/-/g, '_').toUpperCase()}_MERCHANT_ID`
      const envMerchantId = process.env[prefix]?.trim()
      if (envMerchantId && envMerchantId === merchantId) {
        return id
      }
    }

    const jsonRaw = process.env.CLOVER_LOCATIONS_JSON?.trim()
    if (jsonRaw) {
      try {
        const parsed = JSON.parse(jsonRaw) as Record<string, { merchantId?: string }>
        for (const [id, value] of Object.entries(parsed)) {
          if (value.merchantId?.trim() === merchantId) {
            return normalizeLocationId(id)
          }
        }
      } catch {
        // ignore invalid JSON
      }
    }
  }

  return normalized || DEFAULT_LOCATION_ID
}
