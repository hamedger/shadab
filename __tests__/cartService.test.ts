import {
  calculateTax,
  calculateServiceFee,
  calculateOrderTotal,
  calculateTipFromPercent,
  TAX_RATE,
  SERVICE_FEE_RATE,
} from '../lib/services/cartService'

describe('cartService', () => {
  describe('calculateTax', () => {
    it('calculates 6% tax rounded to nearest cent', () => {
      expect(calculateTax(1000)).toBe(60)
      expect(calculateTax(1799)).toBe(Math.round(1799 * TAX_RATE))
    })
  })

  describe('calculateServiceFee', () => {
    it('calculates 3% service fee rounded to nearest cent', () => {
      expect(calculateServiceFee(1000)).toBe(30)
      expect(calculateServiceFee(2000)).toBe(Math.round(2000 * SERVICE_FEE_RATE))
    })
  })

  describe('calculateTipFromPercent', () => {
    it('calculates tip rounded to nearest cent', () => {
      expect(calculateTipFromPercent(1000, 15)).toBe(150)
      expect(calculateTipFromPercent(1799, 20)).toBe(Math.round(1799 * 0.2))
    })
  })

  describe('calculateOrderTotal', () => {
    it('sums subtotal, tax, service fee, and tip', () => {
      const total = calculateOrderTotal({ subtotal: 1000, tip: 200 })
      expect(total).toBe(1000 + 60 + 30 + 200)
    })

    it('applies discounts and never returns negative', () => {
      const total = calculateOrderTotal({
        subtotal: 500,
        promoDiscount: 2000,
        loyaltyPointsToRedeem: 500,
      })
      expect(total).toBe(0)
    })

    it('applies all deductions', () => {
      const total = calculateOrderTotal({
        subtotal: 5000,
        tip: 500,
        promoDiscount: 300,
        loyaltyPointsToRedeem: 200,
        giftCardAmount: 100,
      })
      const expected =
        5000 +
        calculateTax(5000) +
        calculateServiceFee(5000) +
        500 -
        300 -
        200 -
        100
      expect(total).toBe(expected)
    })
  })
})
