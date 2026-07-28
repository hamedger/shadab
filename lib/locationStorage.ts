const SELECTED_LOCATION_KEY = 'deccan_selected_location_id'
const ADMIN_LOCATION_FILTER_KEY = 'deccan_admin_location_filter'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readStoredLocationId(): string | null {
  if (!canUseStorage()) return null
  try {
    return window.localStorage.getItem(SELECTED_LOCATION_KEY)
  } catch {
    return null
  }
}

export function writeStoredLocationId(id: string | null): void {
  if (!canUseStorage()) return
  try {
    if (id) window.localStorage.setItem(SELECTED_LOCATION_KEY, id)
    else window.localStorage.removeItem(SELECTED_LOCATION_KEY)
  } catch {
    // ignore quota / private mode
  }
}

export function readAdminLocationFilter(): string | null {
  if (!canUseStorage()) return null
  try {
    return window.localStorage.getItem(ADMIN_LOCATION_FILTER_KEY)
  } catch {
    return null
  }
}

export function writeAdminLocationFilter(id: string | null): void {
  if (!canUseStorage()) return
  try {
    if (id) window.localStorage.setItem(ADMIN_LOCATION_FILTER_KEY, id)
    else window.localStorage.removeItem(ADMIN_LOCATION_FILTER_KEY)
  } catch {
    // ignore
  }
}
