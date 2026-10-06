/**
 * Verifies the guest reservation confirmation email content.
 * Uses compiled Cloud Functions output (run `cd functions && npm run build` first).
 */
import {
  buildCustomerReservationConfirmationBody,
  buildCustomerReservationConfirmationSubject,
} from '../functions/lib/email/customerReservationConfirmationEmail'

const input = {
  reservationId: 'abcXYZ123456',
  toEmail: 'jane@example.com',
  name: 'Jane Doe',
  meal: 'dinner',
  date: '2026-10-16',
  time: '7:00 PM',
  partySize: 4,
  adults: 2,
  children: 1,
  infants: 1,
  subtotalCents: 3748,
  taxCents: 403,
  feeCents: 4151,
}

describe('reservation confirmation email', () => {
  it('puts the date and seating time in the subject', () => {
    expect(buildCustomerReservationConfirmationSubject(input)).toBe(
      'Your table at Shadab is reserved — Friday, October 16, 2026 at 7:00 PM',
    )
  })

  it('includes meal, party, amounts, and the cancel-by-phone policy', () => {
    const body = buildCustomerReservationConfirmationBody(input)
    expect(body).toContain('RESERVATION #123456')
    expect(body).toContain('Show this email at the host stand')
    expect(body).toContain('Dinner Buffet')
    expect(body).toContain('Party: 2 adults, 1 child (5–10), 1 child under 5')
    expect(body).toContain('Tax: $4.03')
    expect(body).toContain('Total paid: $41.51')
    expect(body).toContain('Free cancellation up to 48 hours before your reservation.')
    expect(body).toContain('20% fee')
    expect(body).toContain('call us at (877) 742-3222')
    expect(body).toContain('2309-11 W Devon Ave, Chicago, IL 60659')
  })

  it('clarifies after-midnight dinner seatings', () => {
    const body = buildCustomerReservationConfirmationBody({ ...input, time: '12:30 AM' })
    expect(body).toContain('12:30 AM (after midnight, the night of the date above)')
  })
})
