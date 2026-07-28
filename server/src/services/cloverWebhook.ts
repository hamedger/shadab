import crypto from 'crypto'

export interface ParsedCloverWebhook {
  status: string
  type: string
  paymentId: string
  checkoutSessionId: string
  merchantId: string
}

export function verifyCloverSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!secret || !signatureHeader) {
    return false
  }

  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=')
    if (key && value) {
      acc[key.trim()] = value.trim()
    }
    return acc
  }, {})

  const timestamp = parts.t
  const v1 = parts.v1
  if (!timestamp || !v1) {
    return false
  }

  const signedPayload = `${timestamp}.${rawBody}`
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
  } catch {
    return false
  }
}

export function parseCloverWebhook(rawBody: string): ParsedCloverWebhook | null {
  try {
    const payload = JSON.parse(rawBody) as Record<string, unknown>
    const status = String(payload.status ?? payload.Status ?? '').toUpperCase()
    const type = String(payload.type ?? payload.Type ?? '').toUpperCase()
    const paymentId = String(payload.id ?? payload.Id ?? '')
    const merchantId = String(payload.merchantId ?? payload.MerchantId ?? '')

    const rawData = payload.data ?? payload.Data
    let checkoutSessionId = ''
    if (typeof rawData === 'string') {
      checkoutSessionId = rawData.trim()
    } else if (rawData && typeof rawData === 'object') {
      const dataObj = rawData as Record<string, unknown>
      checkoutSessionId = String(
        dataObj.checkoutSessionId ??
          dataObj.checkoutSessionUUID ??
          dataObj.id ??
          dataObj.Id ??
          '',
      ).trim()
    }

    if (!status || !type) {
      return null
    }

    return {
      status,
      type,
      paymentId,
      checkoutSessionId,
      merchantId,
    }
  } catch {
    return null
  }
}

export function verifyCloverSignatureWithAnySecret(
  rawBody: string,
  signatureHeader: string | undefined,
  secrets: string[],
): boolean {
  return secrets.some((secret) => verifyCloverSignature(rawBody, signatureHeader, secret))
}
