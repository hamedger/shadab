import { Timestamp } from 'firebase/firestore'
import { Address } from './user'

export type OrderStatus =
  | 'pending'
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'

export type FulfillmentType = 'delivery' | 'pickup'

export interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  instructions?: string
  imageURL?: string
}

export interface Order {
  id: string
  userId: string | 'guest'
  guestName?: string
  guestEmail: string
  guestPhone: string
  locationId: string
  items: OrderItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  deliveryDistanceMiles?: number
  serviceFee: number
  tip: number
  promoCode: string
  promoDiscount: number
  loyaltyPointsUsed: number
  loyaltyPointsEarned: number
  loyaltyAwarded?: boolean
  giftCardAmount: number
  total: number
  fulfillmentType: FulfillmentType
  scheduledFor: Timestamp | null
  pickupTime: Timestamp | null
  deliveryAddress: Address
  status: OrderStatus
  cloverMerchantId?: string
  cloverCheckoutSessionId?: string
  cloverPaymentId?: string
  notes: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
