import { LOYALTY } from '../../constants/config'
import { LoyaltyTier } from '../../types/user'

export function getLoyaltyTier(points: number): LoyaltyTier {
  if (points >= LOYALTY.tiers.platinum.min) return 'platinum'
  if (points >= LOYALTY.tiers.gold.min) return 'gold'
  if (points >= LOYALTY.tiers.silver.min) return 'silver'
  return 'bronze'
}

export function getNextTierMin(tier: LoyaltyTier): number | null {
  if (tier === 'platinum') return null
  if (tier === 'bronze') return LOYALTY.tiers.silver.min
  if (tier === 'silver') return LOYALTY.tiers.gold.min
  return LOYALTY.tiers.platinum.min
}

export function getPointsToNextTier(points: number, tier: LoyaltyTier): number | null {
  const nextMin = getNextTierMin(tier)
  return nextMin === null ? null : nextMin - points
}

export function pointsToDollarValue(points: number): number {
  return points / LOYALTY.pointsToDollar
}

export function getMaxRedeemablePoints(points: number): number {
  return Math.floor(points / LOYALTY.pointsToDollar) * LOYALTY.pointsToDollar
}

export function calculateEarnedPoints(orderSubtotalCents: number): number {
  return Math.floor((orderSubtotalCents / 100) * LOYALTY.pointsPerDollar)
}

/** Convert redeemed points to order discount in cents (100 pts = $1 off). */
export function loyaltyDiscountCents(pointsRedeemed: number): number {
  if (pointsRedeemed <= 0) return 0
  return Math.floor(pointsRedeemed / LOYALTY.pointsToDollar) * 100
}
