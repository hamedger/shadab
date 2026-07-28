import { create } from 'zustand'
import { readAdminLocationFilter, writeAdminLocationFilter } from '../lib/locationStorage'
import { normalizeLocationId } from '../lib/locationUtils'

interface AdminLocationState {
  filterLocationId: string | null
  hasHydrated: boolean
  hydrate: () => void
  setFilterLocationId: (id: string | null) => void
}

export const useAdminLocationStore = create<AdminLocationState>((set) => ({
  filterLocationId: null,
  hasHydrated: false,

  hydrate: () => {
    const stored = readAdminLocationFilter()
    const normalized = stored ? normalizeLocationId(stored) : null
    if (stored && normalized !== stored) {
      writeAdminLocationFilter(normalized)
    }
    set({ filterLocationId: normalized, hasHydrated: true })
  },

  setFilterLocationId: (id) => {
    const normalized = id ? normalizeLocationId(id) : null
    writeAdminLocationFilter(normalized)
    set({ filterLocationId: normalized })
  },
}))
