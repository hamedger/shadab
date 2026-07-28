import {
  locationIdsForFirestoreQuery,
  mergeAllLocations,
  mergePickableLocations,
  normalizeLocationId,
  resolveOrderLocationLabel,
} from '../lib/locationUtils'
import { Location } from '../types/location'

describe('normalizeLocationId', () => {
  it('leaves canonical ids unchanged', () => {
    expect(normalizeLocationId('chicago-il')).toBe('chicago-il')
  })
})

describe('locationIdsForFirestoreQuery', () => {
  it('returns just the normalized id when there are no aliases', () => {
    expect(locationIdsForFirestoreQuery('chicago-il')).toEqual(['chicago-il'])
  })
})

describe('mergePickableLocations', () => {
  it('overlays remote fields onto the static Chicago location', () => {
    const remote: Location[] = [
      {
        id: 'chicago-il',
        name: 'Shadab — Chicago',
        phone: '+1 312-555-0100',
        isActive: true,
        address: {
          street: '123 Main St',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
          country: 'US',
        },
      } as Location,
    ]

    const merged = mergePickableLocations(remote)

    expect(merged).toHaveLength(1)
    expect(merged[0].id).toBe('chicago-il')
    expect(merged[0].phone).toBe('+1 312-555-0100')
  })
})

describe('mergeAllLocations', () => {
  it('always includes the static Chicago location', () => {
    const merged = mergeAllLocations([])
    expect(merged.map((l) => l.id)).toEqual(['chicago-il'])
  })
})

describe('resolveOrderLocationLabel', () => {
  it('returns short name for the canonical id', () => {
    expect(resolveOrderLocationLabel('chicago-il')).toBe('Chicago')
  })

  it('falls back when locationId is missing', () => {
    expect(resolveOrderLocationLabel(undefined)).toBe('Unknown location')
  })
})
