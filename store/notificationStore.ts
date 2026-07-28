import { create } from 'zustand'

interface NotificationPrefs {
  orderUpdates: boolean
  promotions: boolean
  buffetAlerts: boolean
  newMenuItems: boolean
}

interface NotificationState {
  pushToken: string | null
  prefs: NotificationPrefs
  setPushToken: (token: string | null) => void
  setPrefs: (prefs: Partial<NotificationPrefs>) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  pushToken: null,
  prefs: {
    orderUpdates: true,
    promotions: true,
    buffetAlerts: true,
    newMenuItems: false,
  },
  setPushToken: (token) => set({ pushToken: token }),
  setPrefs: (prefs) => set((state) => ({ prefs: { ...state.prefs, ...prefs } })),
}))
