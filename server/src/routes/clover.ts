import { Router } from 'express'
import { assertAnyCloverLocationConfigured, getAllCloverWebhookSecrets, getCloverLocationConfig, getCloverWebhookSecretsForMerchant } from '../lib/cloverLocations'
import { normalizeLocationId } from '../lib/locationIds'
import { requireAuth, AuthedRequest } from '../middleware/auth'
import { createCheckoutSession } from '../services/cloverClient'
import {
  attachCheckoutSession,
  cancelUnpaidPendingOrder,
  createPendingOrder,
  markOrderDeclinedByCheckoutSession,
  markOrderPaidByCheckoutSession,
} from '../services/orderService'
import { parseCloverWebhook, verifyCloverSignatureWithAnySecret } from '../services/cloverWebhook'

export const cloverRouter = Router()

cloverRouter.post('/checkout', requireAuth, async (req: AuthedRequest, res) => {
  try {
    assertAnyCloverLocationConfigured()

    const uid = req.uid
    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const {
      items,
      subtotal,
      tax,
      serviceFee,
      deliveryFee = 0,
      tip = 0,
      promoCode = '',
      promoDiscount = 0,
      loyaltyPointsUsed = 0,
      giftCardAmount = 0,
      total,
      fulfillmentType,
      deliveryAddress = null,
      locationId,
      notes = '',
      customerName = '',
      customerPhone = '',
      customerEmail: bodyEmail = '',
      pickupDate = '',
      pickupTime = '',
    } = req.body ?? {}

    const customerEmail = (bodyEmail || req.userEmail)?.trim()

    if (!locationId || typeof locationId !== 'string') {
      res.status(400).json({ error: 'locationId is required' })
      return
    }

    if (fulfillmentType === 'delivery') {
      const phoneDigits = String(customerPhone ?? '').replace(/\D/g, '')
      if (phoneDigits.length < 10) {
        res.status(400).json({ error: 'Valid phone number is required for delivery orders' })
        return
      }
      if (!deliveryAddress?.street?.trim() || !deliveryAddress?.city?.trim()) {
        res.status(400).json({ error: 'Complete delivery address is required' })
        return
      }
    }

    const normalizedLocationId = normalizeLocationId(locationId)
    if (!normalizedLocationId) {
      res.status(400).json({ error: 'locationId is required' })
      return
    }

    const clover = getCloverLocationConfig(normalizedLocationId)

    const pending = await createPendingOrder({
      cloverMerchantId: clover.merchantId,
      uid,
      customerEmail,
      customerName,
      customerPhone,
      items,
      subtotal,
      tax,
      serviceFee,
      deliveryFee,
      tip,
      promoCode,
      promoDiscount,
      loyaltyPointsUsed,
      giftCardAmount,
      total,
      fulfillmentType,
      deliveryAddress,
      locationId: normalizedLocationId,
      notes,
      pickupDate,
      pickupTime,
    })

    let session
    try {
      session = await createCheckoutSession({
        clover,
        customer: pending.customer,
        lineItems: pending.lineItems,
        orderId: pending.orderId,
      })
    } catch (sessionError) {
      await cancelUnpaidPendingOrder(pending.orderId, uid)
      throw sessionError
    }

    await attachCheckoutSession(pending.orderId, session.checkoutSessionId)

    res.json({
      orderId: pending.orderId,
      href: session.href,
      checkoutSessionId: session.checkoutSessionId,
      expirationTime: session.expirationTime,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start checkout'
    const status =
      message.includes('totals') ||
      message.includes('empty') ||
      message.includes('loyalty') ||
      message.includes('profile')
        ? 400
        : 500
    res.status(status).json({ error: message })
  }
})

cloverRouter.post('/webhook', async (req, res) => {
  try {
    assertAnyCloverLocationConfigured()

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : ''
    const signature = req.header('Clover-Signature') ?? req.header('clover-signature') ?? undefined

    if (!rawBody.trim()) {
      res.status(400).json({ error: 'Empty webhook body — check raw JSON parser for this route' })
      return
    }

    const event = parseCloverWebhook(rawBody)
    if (!event) {
      res.status(400).json({ error: 'Invalid webhook payload' })
      return
    }

    const secrets = event.merchantId
      ? getCloverWebhookSecretsForMerchant(event.merchantId)
      : getAllCloverWebhookSecrets()
    const verificationSecrets = secrets.length > 0 ? secrets : getAllCloverWebhookSecrets()

    if (!verifyCloverSignatureWithAnySecret(rawBody, signature, verificationSecrets)) {
      res.status(400).json({ error: 'Invalid Clover signature' })
      return
    }

    if (event.type !== 'PAYMENT' || !event.checkoutSessionId) {
      res.sendStatus(200)
      return
    }

    if (event.status === 'APPROVED') {
      await markOrderPaidByCheckoutSession(event.checkoutSessionId, event.paymentId)
    } else if (event.status === 'DECLINED') {
      await markOrderDeclinedByCheckoutSession(event.checkoutSessionId)
    }

    res.sendStatus(200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed'
    res.status(500).json({ error: message })
  }
})
