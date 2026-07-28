import {
  getLoyaltyTier,
  getPointsToNextTier,
  pointsToDollarValue,
  getMaxRedeemablePoints,
  calculateEarnedPoints,
  loyaltyDiscountCents,
} from '../lib/services/loyaltyService'

describe('loyaltyService', () => {
  describe('getLoyaltyTier', () => {
    it('assigns correct tiers by point thresholds', () => {
      expect(getLoyaltyTier(0)).toBe('bronze')
      expect(getLoyaltyTier(499)).toBe('bronze')
      expect(getLoyaltyTier(500)).toBe('silver')
      expect(getLoyaltyTier(1500)).toBe('gold')
      expect(getLoyaltyTier(3000)).toBe('platinum')
    })
  })

  describe('getPointsToNextTier', () => {
    it('calculates remaining points to next tier', () => {
      expect(getPointsToNextTier(200, 'bronze')).toBe(300)
      expect(getPointsToNextTier(3000, 'platinum')).toBeNull()
    })
  })

  describe('pointsToDollarValue', () => {
    it('converts points to dollar value at 100:1', () => {
      expect(pointsToDollarValue(500)).toBe(5)
      expect(pointsToDollarValue(150)).toBe(1.5)
    })
  })

  describe('getMaxRedeemablePoints', () => {
    it('rounds down to nearest 100 points', () => {
      expect(getMaxRedeemablePoints(550)).toBe(500)
      expect(getMaxRedeemablePoints(99)).toBe(0)
    })
  })

  describe('calculateEarnedPoints', () => {
    it('awards 1 point per dollar spent', () => {
      expect(calculateEarnedPoints(2500)).toBe(25)
      expect(calculateEarnedPoints(999)).toBe(9)
    })
  })

  describe('loyaltyDiscountCents', () => {
    it('converts redeemed points to cents at 100 pts per dollar', () => {
      expect(loyaltyDiscountCents(500)).toBe(500)
      expect(loyaltyDiscountCents(250)).toBe(200)
      expect(loyaltyDiscountCents(0)).toBe(0)
    })
  })
})
