import { config } from '../config'
import { CloverLocationConfig } from '../lib/cloverLocations'

export interface CloverLineItem {
  name: string
  price: number
  unitQty: number
  note?: string
}

export interface CreateCheckoutSessionInput {
  clover: CloverLocationConfig
  customer: {
    email: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
  }
  lineItems: CloverLineItem[]
  orderId: string
}

export interface CloverCheckoutSession {
  href: string
  checkoutSessionId: string
  createdTime: number
  expirationTime: number
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CloverCheckoutSession> {
  const { merchantId, privateKey, pageConfigUuid } = input.clover
  const siteBase = config.clover.siteUrl.replace(/\/$/, '')
  const successBase = config.clover.successUrl ?? `${siteBase}/`
  const failureBase = config.clover.failureUrl ?? `${siteBase}/checkout`

  const body: Record<string, unknown> = {
    customer: {
      email: input.customer.email,
      firstName: input.customer.firstName ?? 'Guest',
      lastName: input.customer.lastName ?? 'Customer',
      ...(input.customer.phoneNumber ? { phoneNumber: input.customer.phoneNumber } : {}),
    },
    shoppingCart: {
      lineItems: input.lineItems,
    },
  }

  if (pageConfigUuid) {
    body.pageConfigUuid = pageConfigUuid
  }

  if (config.clover.tipsEnabled) {
    body.tips = { enabled: true }
  }

  if (successBase || failureBase) {
    body.redirectUrls = {
      ...(successBase
        ? {
            success: appendQuery(successBase, {
              orderId: input.orderId,
              session_id: '{CHECKOUT_SESSION_ID}',
              payment: 'success',
            }),
          }
        : {}),
      ...(failureBase
        ? {
            failure: appendQuery(failureBase, {
              orderId: input.orderId,
              error: '{ERROR_CODE}',
            }),
          }
        : {}),
    }
  }

  const response = await fetch(
    `${config.clover.apiBaseUrl}/invoicingcheckoutservice/v1/checkouts`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Clover-Merchant-Id': merchantId,
        Authorization: `Bearer ${privateKey}`,
      },
      body: JSON.stringify(body),
    },
  )

  const payload = (await response.json().catch(() => ({}))) as CloverCheckoutSession & {
    message?: string
    error?: { message?: string }
  }

  if (!response.ok) {
    const message =
      payload.message ??
      payload.error?.message ??
      `Clover checkout failed with status ${response.status}`
    throw new Error(message)
  }

  if (!payload.href || !payload.checkoutSessionId) {
    throw new Error('Clover checkout response missing href or checkoutSessionId')
  }

  return payload
}

function appendQuery(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}
