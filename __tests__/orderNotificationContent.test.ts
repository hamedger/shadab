/**
 * Verifies staff email subject/body reflect the paid Firestore order document.
 * Uses compiled Cloud Functions output (run `cd functions && npm run build` first).
 */

import {
  buildOrderNotificationBody,
  buildOrderNotificationSubject,
} from '../functions/lib/email/orderNotification'
import { orderNotificationInputFromDoc } from '../functions/lib/email/orderNotificationInput'

function paidOrderDoc(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user-abc',
    guestEmail: 'customer@example.com',
    guestPhone: '2485550100',
    locationId: 'chicago-il',
    fulfillmentType: 'pickup',
    subtotal: 399,
    tax: 24,
    serviceFee: 12,
    total: 435,
    scheduledFor: '2026-06-28',
    pickupTime: 'asap',
    notes: 'Extra crispy please',
    cloverPaymentId: 'clover_pay_123',
    status: 'placed',
    items: [{ menuItemId: 'butter-naan', name: 'Butter Naan', price: 399, quantity: 1 }],
    ...overrides,
  }
}

describe('paid order email content', () => {
  const orderId = 'abc123xyzWUKQ4X'

  it('includes order id, location, total, customer, notes, and line items', () => {
    const order = paidOrderDoc()
    const input = orderNotificationInputFromDoc(orderId, order)
    const subject = buildOrderNotificationSubject(input)
    const body = buildOrderNotificationBody(input)

    expect(subject).toBe('[Northville] New Order #WUKQ4X — Pickup — $4.35')
    expect(body).toContain(`Order ID: ${orderId} (#WUKQ4X)`)
    expect(body).toContain('New order at Northville')
    expect(body).toContain('Fulfillment: pickup')
    expect(body).toContain('Total: $4.35')
    expect(body).toContain('Scheduled: 2026-06-28 asap')
    expect(body).toContain('Customer email: customer@example.com')
    expect(body).toContain('Customer phone: 2485550100')
    expect(body).toContain('Notes: Extra crispy please')
    expect(body).toContain('- 1x Butter Naan — $3.99')
  })

  it('reflects delivery orders and multiple items', () => {
    const order = paidOrderDoc({
      locationId: 'farmington-hills-mi',
      fulfillmentType: 'delivery',
      total: 544,
      notes: '',
      items: [
        { name: 'French Fries', price: 499, quantity: 1 },
        { name: 'Garlic Naan', price: 399, quantity: 2, instructions: 'Well done' },
      ],
    })

    const input = orderNotificationInputFromDoc(orderId, order)
    const subject = buildOrderNotificationSubject(input)
    const body = buildOrderNotificationBody(input)

    expect(subject).toContain('[Farmington Hills]')
    expect(subject).toContain('Delivery')
    expect(subject).toContain('$5.44')
    expect(body).toContain('- 1x French Fries — $4.99')
    expect(body).toContain('- 2x Garlic Naan (Well done) — $7.98')
    expect(body).not.toContain('Notes:')
  })

  it('uses the same document fields notifyStaffOnOrder reads after payment', () => {
    const order = paidOrderDoc({
      guestEmail: 'e2e.notify@mailinator.com',
      notes: 'Email notification e2e chicago-il 1782608441372',
      items: [{ name: 'French Fries', price: 499, quantity: 1 }],
      total: 544,
    })

    const input = orderNotificationInputFromDoc(orderId, order)
    const body = buildOrderNotificationBody(input)

    expect(input.items).toHaveLength(1)
    expect(input.items[0].name).toBe('French Fries')
    expect(input.total).toBe(544)
    expect(body).toContain('e2e.notify@mailinator.com')
    expect(body).toContain('Email notification e2e chicago-il 1782608441372')
    expect(body).toContain('- 1x French Fries — $4.99')
  })
})
