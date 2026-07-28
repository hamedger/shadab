import {
  shouldAlertForNewPaidOrder,
  snapshotOrderForAlerts,
} from '../lib/admin/orderAlerts'
import { Order, OrderStatus } from '../types/order'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'abc123def456ghi789jkl012mno345',
    userId: 'user1',
    locationId: 'chicago-il',
    items: [{ menuItemId: 'biryani', name: 'Biryani', price: 1499, quantity: 1 }],
    subtotal: 1499,
    tax: 90,
    deliveryFee: 0,
    serviceFee: 45,
    tip: 0,
    promoCode: '',
    promoDiscount: 0,
    loyaltyPointsUsed: 0,
    loyaltyPointsEarned: 14,
    giftCardAmount: 0,
    total: 1634,
    fulfillmentType: 'pickup',
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('order alert detection', () => {
  it('alerts when an order moves from pending to placed', () => {
    const previous = snapshotOrderForAlerts(makeOrder({ status: 'pending' }))
    const current = makeOrder({ status: 'placed', cloverPaymentId: 'clover_sess_1' })
    expect(shouldAlertForNewPaidOrder(previous, current)).toBe(true)
  })

  it('alerts when payment id is recorded after pending', () => {
    const previous = snapshotOrderForAlerts(makeOrder({ status: 'pending' }))
    const current = makeOrder({ status: 'confirmed', cloverPaymentId: 'pay_123' })
    expect(shouldAlertForNewPaidOrder(previous, current)).toBe(true)
  })

  it('does not alert on initial snapshot without previous state', () => {
    const current = makeOrder({ status: 'placed', cloverPaymentId: 'pay_123' })
    expect(shouldAlertForNewPaidOrder(undefined, current)).toBe(false)
  })

  it('does not alert for status-only admin updates', () => {
    const previous = snapshotOrderForAlerts(
      makeOrder({ status: 'confirmed', cloverPaymentId: 'pay_123' }),
    )
    const current = makeOrder({ status: 'preparing' as OrderStatus, cloverPaymentId: 'pay_123' })
    expect(shouldAlertForNewPaidOrder(previous, current)).toBe(false)
  })
})

describe('resolveCloverPaymentId', () => {
  function resolve(paymentId: string, sessionId: string) {
    const resolved = paymentId.trim()
    if (resolved) return resolved
    const session = sessionId.trim()
    return session ? `clover_${session}` : ''
  }

  it('uses webhook payment id when present', () => {
    expect(resolve('pay_abc', 'sess_1')).toBe('pay_abc')
  })

  it('falls back to checkout session id', () => {
    expect(resolve('', '38ef587f-873b-4d7c-bd03-946c6c1c4821')).toBe(
      'clover_38ef587f-873b-4d7c-bd03-946c6c1c4821',
    )
  })
})
