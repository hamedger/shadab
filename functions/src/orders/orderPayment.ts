/** Fallback Clover payment id when the webhook omits payment id. */
export function resolveCloverPaymentId(
  paymentId: string | undefined | null,
  checkoutSessionId: string | undefined | null,
): string {
  const resolved = String(paymentId ?? '').trim()
  if (resolved) return resolved
  const sessionId = String(checkoutSessionId ?? '').trim()
  return sessionId ? `clover_${sessionId}` : ''
}

/** True when Clover payment has been recorded on the order. */
export function hasOrderPayment(order: Record<string, unknown>): boolean {
  return String(order.cloverPaymentId ?? '').trim().length > 0
}

/** Firestore before/after: payment just succeeded (status → placed or payment id set). */
export function orderPaymentJustRecorded(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown>,
): boolean {
  if (before?.status !== 'placed' && after.status === 'placed') return true
  if (
    !String(before?.cloverPaymentId ?? '').trim() &&
    String(after.cloverPaymentId ?? '').trim()
  ) {
    return true
  }
  return false
}

export const POST_PAYMENT_STATUSES = new Set([
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
])
