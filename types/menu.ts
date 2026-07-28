import { Timestamp } from 'firebase/firestore'

export interface MenuLocationStock {
  isAvailable?: boolean
  trackStock?: boolean
  stockQty?: number | null
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  subcategory: string
  imageURL: string
  isAvailable: boolean
  trackStock?: boolean
  stockQty?: number | null
  stockThreshold?: number
  isHalal: boolean
  isVegetarian: boolean
  isSpicy: boolean
  spiceLevel: 1 | 2 | 3
  allergens: string[]
  calories?: number
  tags: string[]
  isBuffetItem: boolean
  rating: number
  reviewCount: number
  locationIds: string[]
  /** Per-store stock overrides; falls back to global isAvailable when unset. */
  locationStock?: Record<string, MenuLocationStock>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Review {
  id: string
  userId: string
  userName: string
  menuItemId: string
  orderId: string
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
  images: string[]
  isVerifiedPurchase: boolean
  likes: number
  createdAt: Timestamp
}
