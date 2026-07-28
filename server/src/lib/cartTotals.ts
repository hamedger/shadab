import { loyaltyDiscountCents } from './loyalty'

export const TAX_RATE = 0.06
export const SERVICE_FEE_RATE = 0.03

export interface TotalsInput {
  subtotal: number
  deliveryFee: number
  tip?: number
  promoDiscount?: number
  loyaltyPointsUsed?: number
  giftCardAmount?: number
}

export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE)
}

export function calculateServiceFee(subtotal: number): number {
  return Math.round(subtotal * SERVICE_FEE_RATE)
}

export function calculateTotal(input: TotalsInput): number {
  const {
    subtotal,
    deliveryFee,
    tip = 0,
    promoDiscount = 0,
    loyaltyPointsUsed = 0,
    giftCardAmount = 0,
  } = input

  const tax = calculateTax(subtotal)
  const serviceFee = calculateServiceFee(subtotal)
  const loyaltyDiscount = loyaltyDiscountCents(loyaltyPointsUsed)
  const total =
    subtotal +
    tax +
    serviceFee +
    deliveryFee +
    tip -
    promoDiscount -
    loyaltyDiscount -
    giftCardAmount

  return Math.max(0, total)
}
