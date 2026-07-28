import { Order } from '../types/order'
import { useCartStore } from '../store/cartStore'

export function reorderToCart(order: Order): void {
  const { loadFromOrder } = useCartStore.getState()
  loadFromOrder(order)
}
