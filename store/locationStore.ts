import { create } from 'zustand'
import { readStoredLocationId, writeStoredLocationId } from '../lib/locationStorage'
import { normalizeLocationId } from '../lib/locationUtils'

interface LocationState {
  selectedLocationId: string | null
  hasHydrated: boolean
  hydrate: () => void
  setSelectedLocationId: (id: string) => void
  clearSelectedLocation: () => void
}

export const useLocationStore = create<LocationState>((set) => ({
  selectedLocationId: null,
  hasHydrated: false,

  hydrate: () => {
    const stored = readStoredLocationId()
    const normalized = stored ? normalizeLocationId(stored) : null
    if (stored && normalized !== stored) {
      writeStoredLocationId(normalized)
    }
    set({ selectedLocationId: normalized, hasHydrated: true })
  },

  setSelectedLocationId: (id) => {
    const normalized = normalizeLocationId(id)
    writeStoredLocationId(normalized)
    set({ selectedLocationId: normalized })
  },

  clearSelectedLocation: () => {
    writeStoredLocationId(null)
    set({ selectedLocationId: null })
  },
}))
