const STORAGE_KEY = 'deccan_revenue_access'

export const ADMIN_REVENUE_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_REVENUE_PASSWORD ?? ''

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function isRevenuePasswordConfigured(): boolean {
  return ADMIN_REVENUE_PASSWORD.length > 0
}

export function checkRevenuePassword(input: string): boolean {
  if (!isRevenuePasswordConfigured()) return true
  return input === ADMIN_REVENUE_PASSWORD
}

export function readRevenueUnlocked(): boolean {
  if (!isRevenuePasswordConfigured()) return true
  if (!canUseSessionStorage()) return false
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeRevenueUnlocked(unlocked: boolean): void {
  if (!canUseSessionStorage()) return
  try {
    if (unlocked) window.sessionStorage.setItem(STORAGE_KEY, '1')
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore quota / private mode
  }
}
