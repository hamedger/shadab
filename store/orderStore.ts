import { create } from 'zustand'
import { Order } from '../types/order'

interface OrderState {
  activeOrder: Order | null
  orderHistory: Order[]
  setActiveOrder: (order: Order | null) => void
  setOrderHistory: (orders: Order[]) => void
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrder: null,
  orderHistory: [],
  setActiveOrder: (order) => set({ activeOrder: order }),
  setOrderHistory: (orders) => set({ orderHistory: orders }),
}))
