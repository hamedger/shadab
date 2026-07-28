import { create } from 'zustand'
import { Platform } from 'react-native'
import { FulfillmentType, Order, OrderItem } from '../types/order'
import { DELIVERY_ENABLED } from '../constants/config'
import {
  MOCK_DELIVERY_ETA_MINUTES,
  MOCK_PICKUP_ETA_MINUTES,
} from '../constants/checkout'
import { getDefaultPickupDate, PICKUP_ASAP } from '../lib/services/pickupScheduling'
import { calculateTipFromPercent } from '../lib/services/cartService'

interface CartState {
  items: OrderItem[]
  fulfillmentType: FulfillmentType
  deliveryFee: number
  deliveryEtaMinutes: number
  deliveryDistanceMiles: number | null
  deliveryQuoteReady: boolean
  pickupDate: string
  pickupTime: string
  promoCode: string
  promoDiscount: number
  loyaltyPointsToRedeem: number
  giftCardCode: string
  giftCardAmount: number
  tip: number
  tipPercent: number | null
  notes: string

  addItem: (item: Omit<OrderItem, 'quantity'>) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  updateInstructions: (menuItemId: string, instructions: string) => void
  setPromoCode: (code: string, discount: number) => void
  clearPromo: () => void
  setLoyaltyPoints: (points: number) => void
  setGiftCard: (code: string, amount: number) => void
  setTip: (tip: number) => void
  setTipPercent: (percent: number | null) => void
  setNotes: (notes: string) => void
  setFulfillmentType: (type: FulfillmentType) => void
  setDeliveryQuote: (quote: { fee: number; etaMinutes: number; distanceMiles: number }) => void
  clearDeliveryQuote: () => void
  setPickupDate: (date: string) => void
  setPickupTime: (time: string) => void
  clearCart: () => void
  loadFromOrder: (order: Order) => void

  subtotal: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  fulfillmentType: DELIVERY_ENABLED ? 'delivery' : 'pickup',
  deliveryFee: 0,
  deliveryEtaMinutes: DELIVERY_ENABLED ? MOCK_DELIVERY_ETA_MINUTES : MOCK_PICKUP_ETA_MINUTES,
  deliveryDistanceMiles: null,
  deliveryQuoteReady: false,
  pickupDate: getDefaultPickupDate(),
  pickupTime: PICKUP_ASAP,
  promoCode: '',
  promoDiscount: 0,
  loyaltyPointsToRedeem: 0,
  giftCardCode: '',
  giftCardAmount: 0,
  tip: 0,
  tipPercent: null,
  notes: '',

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.menuItemId === item.menuItemId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        }
      }
      return { items: [...state.items, { ...item, quantity: 1 }] }
    })
  },

  removeItem: (menuItemId) => {
    set((state) => ({ items: state.items.filter((i) => i.menuItemId !== menuItemId) }))
  },

  updateQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId)
      return
    }
    set((state) => ({
      items: state.items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i)),
    }))
  },

  updateInstructions: (menuItemId, instructions) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.menuItemId === menuItemId ? { ...i, instructions } : i,
      ),
    }))
  },

  setPromoCode: (code, discount) => set({ promoCode: code, promoDiscount: discount }),
  clearPromo: () => set({ promoCode: '', promoDiscount: 0 }),
  setLoyaltyPoints: (points) => set({ loyaltyPointsToRedeem: points }),
  setGiftCard: (code, amount) => set({ giftCardCode: code, giftCardAmount: amount }),
  setTip: (tip) => set({ tip, tipPercent: null }),
  setTipPercent: (percent) => {
    const subtotal = get().subtotal()
    set({
      tipPercent: percent,
      tip: percent != null ? calculateTipFromPercent(subtotal, percent) : 0,
    })
  },
  setNotes: (notes) => set({ notes }),

  setFulfillmentType: (type) => {
    if (type === 'delivery' && !DELIVERY_ENABLED) return
    set({
      fulfillmentType: type,
      deliveryFee: 0,
      deliveryEtaMinutes: type === 'delivery' ? MOCK_DELIVERY_ETA_MINUTES : MOCK_PICKUP_ETA_MINUTES,
      deliveryDistanceMiles: null,
      deliveryQuoteReady: false,
      pickupDate: getDefaultPickupDate(),
      pickupTime: PICKUP_ASAP,
    })
  },

  setDeliveryQuote: (quote) =>
    set({
      deliveryFee: quote.fee,
      deliveryEtaMinutes: quote.etaMinutes,
      deliveryDistanceMiles: quote.distanceMiles,
      deliveryQuoteReady: true,
    }),

  clearDeliveryQuote: () =>
    set({
      deliveryFee: 0,
      deliveryDistanceMiles: null,
      deliveryQuoteReady: false,
    }),

  setPickupDate: (date) => set({ pickupDate: date }),
  setPickupTime: (time) => set({ pickupTime: time }),

  clearCart: () =>
    set({
      items: [],
      fulfillmentType: DELIVERY_ENABLED ? 'delivery' : 'pickup',
      deliveryFee: 0,
      deliveryEtaMinutes: DELIVERY_ENABLED ? MOCK_DELIVERY_ETA_MINUTES : MOCK_PICKUP_ETA_MINUTES,
      deliveryDistanceMiles: null,
      deliveryQuoteReady: false,
      pickupDate: getDefaultPickupDate(),
      pickupTime: PICKUP_ASAP,
      promoCode: '',
      promoDiscount: 0,
      loyaltyPointsToRedeem: 0,
      giftCardCode: '',
      giftCardAmount: 0,
      tip: 0,
      tipPercent: null,
      notes: '',
    }),

  loadFromOrder: (order) => {
    const fulfillmentType =
      order.fulfillmentType === 'delivery' && !DELIVERY_ENABLED ? 'pickup' : order.fulfillmentType
    set({
      items: order.items.map((item) => ({ ...item })),
      fulfillmentType,
      deliveryFee: fulfillmentType === 'delivery' ? order.deliveryFee : 0,
      deliveryEtaMinutes:
        fulfillmentType === 'delivery'
          ? MOCK_DELIVERY_ETA_MINUTES
          : MOCK_PICKUP_ETA_MINUTES,
      deliveryDistanceMiles:
        fulfillmentType === 'delivery' ? order.deliveryDistanceMiles ?? null : null,
      deliveryQuoteReady: fulfillmentType === 'delivery' && order.deliveryFee > 0,
      pickupDate: getDefaultPickupDate(),
      pickupTime: PICKUP_ASAP,
      promoCode: '',
      promoDiscount: 0,
      loyaltyPointsToRedeem: 0,
      giftCardCode: '',
      giftCardAmount: 0,
      tip: order.tip ?? 0,
      tipPercent: null,
      notes: order.notes ?? '',
    })
  },

  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}))

if (Platform.OS === 'web' && process.env.EXPO_PUBLIC_SCREENSHOT_HELPERS === 'true') {
  const SCREENSHOT_CART_KEY = 'deccan_screenshot_cart'

  const applyScreenshotCart = (items: OrderItem[]) => {
    const store = useCartStore.getState()
    store.clearCart()
    for (const item of items) {
      store.addItem(item)
      if (item.quantity > 1) store.updateQuantity(item.menuItemId, item.quantity)
    }
    store.setFulfillmentType('delivery')
  }

  const hydrateScreenshotCart = () => {
    try {
      const raw = sessionStorage.getItem(SCREENSHOT_CART_KEY)
      if (!raw) return
      applyScreenshotCart(JSON.parse(raw) as OrderItem[])
    } catch {
      // ignore invalid seed payload
    }
  }

  const seedCart = (items: OrderItem[]) => {
    sessionStorage.setItem(SCREENSHOT_CART_KEY, JSON.stringify(items))
    applyScreenshotCart(items)
  }

  hydrateScreenshotCart()
  ;(globalThis as typeof globalThis & { __seedCart?: typeof seedCart; __cartItemCount?: () => number })
    .__seedCart = seedCart
  ;(globalThis as typeof globalThis & { __cartItemCount?: () => number }).__cartItemCount = () =>
    useCartStore.getState().itemCount()
}
