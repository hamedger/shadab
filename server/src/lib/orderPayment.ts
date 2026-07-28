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

export function hasOrderPayment(order: Record<string, unknown>): boolean {
  return String(order.cloverPaymentId ?? '').trim().length > 0
}
