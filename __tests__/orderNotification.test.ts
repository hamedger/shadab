/**
 * Unit tests for order notification location labels.
 * Mirrors functions/src/constants/locations.ts + orderNotification subject logic.
 */

const LOCATION_ID_ALIASES: Record<string, string> = {
  farmingtonhills: 'farmington-hills-mi',
}

const LOCATION_LABELS: Record<string, string> = {
  'chicago-il': 'Northville',
  'farmington-hills-mi': 'Farmington Hills',
}

const DEFAULT_LOCATION_ID = 'chicago-il'

function normalizeLocationId(locationId: string): string {
  const trimmed = locationId.trim()
  if (!trimmed) return ''
  const key = trimmed.toLowerCase()
  return LOCATION_ID_ALIASES[key] ?? trimmed
}

function getLocationLabel(locationId: string): string {
  const normalized = normalizeLocationId(locationId)
  return LOCATION_LABELS[normalized] ?? normalized
}

function resolveOrderLocationId(order: {
  locationId?: unknown
  cloverMerchantId?: unknown
}): string {
  const raw = String(order.locationId ?? '').trim()
  const normalized = normalizeLocationId(raw)
  if (normalized && LOCATION_LABELS[normalized]) {
    return normalized
  }

  const merchantId = String(order.cloverMerchantId ?? '').trim()
  if (merchantId === 'FARMINGTON_MERCHANT') {
    return 'farmington-hills-mi'
  }

  return normalized || DEFAULT_LOCATION_ID
}

function buildSubject(locationId: string, orderId: string): string {
  const location = getLocationLabel(locationId)
  const shortId = orderId.slice(-6).toUpperCase()
  return `[${location}] New Order #${shortId} — Pickup — $12.99`
}

describe('order notification location', () => {
  it('labels Northville orders correctly', () => {
    expect(getLocationLabel('chicago-il')).toBe('Northville')
    expect(buildSubject('chicago-il', 'abc123northville')).toContain('[Northville]')
  })

  it('labels Farmington Hills orders correctly', () => {
    expect(getLocationLabel('farmington-hills-mi')).toBe('Farmington Hills')
    expect(buildSubject('farmington-hills-mi', 'abc123farmington')).toContain('[Farmington Hills]')
  })

  it('normalizes legacy Farmington doc ids for email labels', () => {
    expect(getLocationLabel('farmingtonhills')).toBe('Farmington Hills')
    expect(resolveOrderLocationId({ locationId: 'farmingtonhills' })).toBe('farmington-hills-mi')
  })

  it('defaults missing locationId to Northville', () => {
    expect(resolveOrderLocationId({})).toBe('chicago-il')
  })

  it('infers Farmington from Clover merchant when locationId is missing', () => {
    expect(
      resolveOrderLocationId({
        locationId: '',
        cloverMerchantId: 'FARMINGTON_MERCHANT',
      }),
    ).toBe('farmington-hills-mi')
  })
})
