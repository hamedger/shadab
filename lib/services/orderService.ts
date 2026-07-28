import { getFunctions, httpsCallable } from 'firebase/functions'
import app, { isFirebaseConfigured } from '../firebase'
import { FulfillmentType, OrderItem, OrderStatus } from '../../types/order'
import { Address } from '../../types/user'

export interface SubmitOrderInput {
  items: OrderItem[]
  subtotal: number
  tax: number
  serviceFee: number
  deliveryFee: number
  tip: number
  total: number
  promoCode: string
  promoDiscount: number
  loyaltyPointsUsed: number
  giftCardAmount: number
  fulfillmentType: FulfillmentType
  deliveryAddress: Address | null
  notes: string
  locationId?: string
}

export const USER_CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'placed', 'confirmed', 'preparing']

export function canUserCancelOrder(status: OrderStatus): boolean {
  return USER_CANCELLABLE_STATUSES.includes(status)
}

export async function cancelUserOrder(orderId: string): Promise<void> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured')

  const functions = getFunctions(app, 'us-central1')
  const updateOrderStatus = httpsCallable(functions, 'updateOrderStatus')
  await updateOrderStatus({ orderId, status: 'cancelled' })
}
