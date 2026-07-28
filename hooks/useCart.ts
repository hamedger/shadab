import { useCartStore } from '../store/cartStore'
import { MenuItem } from '../types/menu'
import {
  calculateOrderTotal,
  calculateTax,
  calculateServiceFee,
  calculateTipFromPercent,
} from '../lib/services/cartService'

export function useCart() {
  const store = useCartStore()
  const subtotal = store.subtotal()
  const tax = calculateTax(subtotal)
  const serviceFee = calculateServiceFee(subtotal)
  const deliveryFee = store.fulfillmentType === 'delivery' ? store.deliveryFee : 0
  const tip =
    store.tipPercent != null
      ? calculateTipFromPercent(subtotal, store.tipPercent)
      : store.tip
  const total =
    calculateOrderTotal({
      subtotal,
      tip,
      promoDiscount: store.promoDiscount,
      loyaltyPointsToRedeem: store.loyaltyPointsToRedeem,
      giftCardAmount: store.giftCardAmount,
    }) + deliveryFee

  const addMenuItem = (item: MenuItem) => {
    store.addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      imageURL: item.imageURL,
    })
  }

  return {
    ...store,
    addMenuItem,
    tax,
    serviceFee,
    deliveryFee,
    tip,
    total,
  }
}
