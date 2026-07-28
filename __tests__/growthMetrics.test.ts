import { buildRuleBasedBrief, computeGrowthMetrics } from '../lib/admin/growthMetrics'
import { Order } from '../types/order'

function ts(date: Date) {
  return { toDate: () => date } as Order['createdAt']
}

function makeOrder(overrides: Partial<Order> & { createdAt: Date }): Order {
  const { createdAt, ...rest } = overrides
  return {
    id: 'order-1',
    userId: 'user-1',
    guestEmail: '',
    guestPhone: '',
    locationId: 'chicago-il',
    items: [{ menuItemId: 'biryani', name: 'Hyderabadi Dum Biryani', price: 1599, quantity: 2 }],
    subtotal: 3198,
    tax: 256,
    deliveryFee: 0,
    serviceFee: 0,
    tip: 0,
    promoCode: '',
    promoDiscount: 0,
    loyaltyPointsUsed: 0,
    loyaltyPointsEarned: 0,
    giftCardAmount: 0,
    total: 3454,
    fulfillmentType: 'pickup',
    scheduledFor: null,
    pickupTime: null,
    deliveryAddress: {
      id: 'a1',
      label: 'Home',
      street: '1 Main',
      city: 'Northville',
      state: 'MI',
      zip: '48168',
      country: 'US',
    },
    status: 'delivered',
    stripePaymentIntentId: '',
    notes: '',
    createdAt: ts(createdAt),
    updatedAt: ts(createdAt),
    ...rest,
  }
}

describe('growthMetrics', () => {
  it('computes week-over-week revenue change', () => {
    const now = new Date()
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const tenDaysAgo = new Date(now)
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    const orders = [
      makeOrder({ id: 'recent', createdAt: threeDaysAgo, total: 5000 }),
      makeOrder({ id: 'old', createdAt: tenDaysAgo, total: 2000 }),
    ]

    const metrics = computeGrowthMetrics(orders)
    expect(metrics.revenueWeekCents).toBe(5000)
    expect(metrics.ordersWeek).toBe(1)
    expect(metrics.revenueWeekChangePct).toBe(150)
    expect(metrics.topItem).toBe('Hyderabadi Dum Biryani')
  })

  it('builds actionable brief from metrics', () => {
    const brief = buildRuleBasedBrief({
      revenueTodayCents: 12000,
      revenueWeekCents: 85000,
      revenueWeekChangePct: 12,
      ordersWeek: 42,
      ordersWeekChangePct: 5,
      avgOrderValueCents: 2024,
      deliverySharePct: 60,
      lapsedCustomers: 25,
      loyaltyMembers: 180,
      promoOrdersWeek: 2,
      topItem: 'Chicken 65',
      isSaturday: true,
      isBuffetDay: true,
    })

    expect(brief.headline).toContain('buffet')
    expect(brief.insights.length).toBeGreaterThan(0)
    expect(brief.actions.some((a) => a.id === 'buffet-push')).toBe(true)
    expect(brief.actions.some((a) => a.id === 'win-back')).toBe(true)
  })
})
