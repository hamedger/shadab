import { useAuthStore } from '../store/authStore'
import {
  getLoyaltyTier,
  getNextTierMin,
  getPointsToNextTier,
  pointsToDollarValue,
  getMaxRedeemablePoints,
} from '../lib/services/loyaltyService'

export function useLoyalty() {
  const { userProfile } = useAuthStore()
  const points = userProfile?.loyaltyPoints ?? 0
  const tier = getLoyaltyTier(points)
  const nextTierMin = getNextTierMin(tier)
  const pointsToNextTier = getPointsToNextTier(points, tier)

  return {
    points,
    tier,
    nextTierMin,
    pointsToNextTier,
    dollarValue: pointsToDollarValue,
    maxRedeemable: getMaxRedeemablePoints(points),
  }
}
