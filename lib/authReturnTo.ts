export const CHECKOUT_RETURN_PATH = '/checkout'

export function resolveAuthReturnPath(returnTo?: string | string[]): string {
  const path = Array.isArray(returnTo) ? returnTo[0] : returnTo
  if (path && path.startsWith('/')) return path
  return '/(tabs)/'
}

/** After auth from checkout, return to checkout and auto-start Clover payment. */
export function buildAuthReturnRoute(returnTo?: string | string[], autoPay = false) {
  const path = resolveAuthReturnPath(returnTo)
  if (autoPay && path === CHECKOUT_RETURN_PATH) {
    return { pathname: CHECKOUT_RETURN_PATH, params: { pay: '1' } } as const
  }
  return path
}

export function isCheckoutReturn(returnTo?: string | string[]): boolean {
  return resolveAuthReturnPath(returnTo) === CHECKOUT_RETURN_PATH
}
