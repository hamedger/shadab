import { create } from 'zustand'
import {
  checkRevenuePassword,
  readRevenueUnlocked,
  writeRevenueUnlocked,
} from '../lib/revenueAccess'

interface RevenueAccessState {
  unlocked: boolean
  hasHydrated: boolean
  hydrate: () => void
  unlock: (password: string) => boolean
  lock: () => void
}

export const useRevenueAccessStore = create<RevenueAccessState>((set) => ({
  unlocked: false,
  hasHydrated: false,

  hydrate: () => {
    set({ unlocked: readRevenueUnlocked(), hasHydrated: true })
  },

  unlock: (password) => {
    const ok = checkRevenuePassword(password)
    if (ok) {
      writeRevenueUnlocked(true)
      set({ unlocked: true })
    }
    return ok
  },

  lock: () => {
    writeRevenueUnlocked(false)
    set({ unlocked: false })
  },
}))
