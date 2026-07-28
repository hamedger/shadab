import { loyaltyDiscountCents } from './loyaltyService'

export const TAX_RATE = 0.06
export const TAXES_AND_FEES_LABEL = 'Taxes and fees'
export const SERVICE_FEE_RATE = 0.03

export interface OrderTotalsInput {
  subtotal: number
  tip?: number
  promoDiscount?: number
  loyaltyPointsToRedeem?: number
  giftCardAmount?: number
}

export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE)
}

export function calculateServiceFee(subtotal: number): number {
  return Math.round(subtotal * SERVICE_FEE_RATE)
}

export function calculateTipFromPercent(subtotal: number, percent: number): number {
  return Math.round(subtotal * (percent / 100))
}

export function calculateOrderTotal(input: OrderTotalsInput): number {
  const {
    subtotal,
    tip = 0,
    promoDiscount = 0,
    loyaltyPointsToRedeem = 0,
    giftCardAmount = 0,
  } = input

  const tax = calculateTax(subtotal)
  const serviceFee = calculateServiceFee(subtotal)
  const loyaltyDiscount = loyaltyDiscountCents(loyaltyPointsToRedeem)
  const total =
    subtotal + tax + serviceFee + tip - promoDiscount - loyaltyDiscount - giftCardAmount

  return Math.max(0, total)
}
