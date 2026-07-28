import { BuffetDish } from '../../types/buffet'
import { isBuffetDishNeedsRefill } from '../services/buffetService'

export type BuffetRefillSnapshot = {
  needsRefill: boolean
}

export function snapshotBuffetDishForRefillAlerts(dish: BuffetDish): BuffetRefillSnapshot {
  return { needsRefill: isBuffetDishNeedsRefill(dish) }
}

/** True when a dish was just flagged for refill. */
export function shouldAlertForBuffetRefill(
  previous: BuffetRefillSnapshot | undefined,
  current: BuffetDish,
): boolean {
  if (!previous) return false
  return !previous.needsRefill && isBuffetDishNeedsRefill(current)
}

export function formatBuffetRefillAlertTitle(locationName: string): string {
  return `Buffet refill — ${locationName}`
}

export function formatBuffetRefillAlertBody(dishName: string): string {
  return `${dishName} needs a refill`
}

export function showBrowserBuffetRefillNotification(
  locationId: string,
  locationName: string,
  dish: BuffetDish,
): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'granted') return null

  return new Notification(formatBuffetRefillAlertTitle(locationName), {
    body: formatBuffetRefillAlertBody(dish.name),
    tag: `buffet-refill-${locationId}-${dish.menuItemId}`,
    requireInteraction: true,
  })
}
