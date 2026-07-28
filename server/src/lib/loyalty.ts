export const LOYALTY_POINTS_PER_DOLLAR = 1
export const LOYALTY_POINTS_TO_DOLLAR = 100

export function calculateEarnedPoints(subtotalCents: number): number {
  return Math.floor((subtotalCents / 100) * LOYALTY_POINTS_PER_DOLLAR)
}

export function loyaltyDiscountCents(pointsUsed: number): number {
  return Math.floor(pointsUsed / LOYALTY_POINTS_TO_DOLLAR) * 100
}

export function validateRedemption(pointsUsed: number, balance: number): void {
  if (pointsUsed < 0) throw new Error('Invalid loyalty redemption')
  if (pointsUsed === 0) return
  if (pointsUsed % LOYALTY_POINTS_TO_DOLLAR !== 0) {
    throw new Error('Redeem loyalty points in $1 increments (100 pts)')
  }
  if (pointsUsed > balance) throw new Error('Insufficient loyalty points')
}
