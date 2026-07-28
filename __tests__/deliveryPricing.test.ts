import {
  FREE_DELIVERY_RADIUS_MILES,
  MAX_DELIVERY_RADIUS_MILES,
  feeCentsForDistance,
  haversineMiles,
} from '../server/src/lib/deliveryPricing'

describe('deliveryPricing', () => {
  it('is free at and under the free radius', () => {
    expect(feeCentsForDistance(0)).toBe(0)
    expect(feeCentsForDistance(0.5)).toBe(0)
    expect(feeCentsForDistance(FREE_DELIVERY_RADIUS_MILES)).toBe(0)
  })

  it('charges $1 per total mile once past the free radius (no discount for the first mile)', () => {
    expect(feeCentsForDistance(1.5)).toBe(150)
    expect(feeCentsForDistance(2)).toBe(200)
    expect(feeCentsForDistance(3.25)).toBe(325)
    expect(feeCentsForDistance(7.44)).toBe(744)
  })

  it('flags distances beyond the max delivery radius for the caller to reject', () => {
    expect(MAX_DELIVERY_RADIUS_MILES).toBe(10)
    expect(11 > MAX_DELIVERY_RADIUS_MILES).toBe(true)
  })

  it('computes zero distance between identical coordinates', () => {
    expect(haversineMiles(42.4155, -83.4327, 42.4155, -83.4327)).toBeCloseTo(0, 5)
  })

  it('computes a plausible distance between the two store locations', () => {
    // Northville, MI to Farmington Hills, MI is roughly 5-6 miles apart.
    const miles = haversineMiles(42.415478, -83.432717, 42.470675, -83.357126)
    expect(miles).toBeGreaterThan(4)
    expect(miles).toBeLessThan(8)
  })
})
