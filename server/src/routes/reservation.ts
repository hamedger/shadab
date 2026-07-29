import { Router } from 'express'
import { assertAnyCloverLocationConfigured, getCloverLocationConfig } from '../lib/cloverLocations'
import { normalizeLocationId } from '../lib/locationIds'
import { requireAuth, AuthedRequest } from '../middleware/auth'
import { createCheckoutSession } from '../services/cloverClient'
import {
  attachReservationCheckoutSession,
  cancelUnpaidPendingReservation,
  createPendingReservation,
} from '../services/reservationService'

export const reservationRouter = Router()

reservationRouter.post('/checkout', requireAuth, async (req: AuthedRequest, res) => {
  try {
    assertAnyCloverLocationConfigured()

    const uid = req.uid
    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const {
      partySize,
      date,
      time,
      occasion = '',
      specialRequests = '',
      locationId,
      customerName = '',
      customerPhone = '',
      customerEmail: bodyEmail = '',
    } = req.body ?? {}

    const customerEmail = (bodyEmail || req.userEmail)?.trim()

    if (!locationId || typeof locationId !== 'string') {
      res.status(400).json({ error: 'locationId is required' })
      return
    }
    if (!customerEmail) {
      res.status(400).json({ error: 'Valid email is required' })
      return
    }

    const normalizedLocationId = normalizeLocationId(locationId)
    const clover = getCloverLocationConfig(normalizedLocationId)

    const pending = await createPendingReservation({
      cloverMerchantId: clover.merchantId,
      uid,
      customerEmail,
      customerName,
      customerPhone,
      partySize: Number(partySize),
      date: String(date ?? ''),
      time: String(time ?? ''),
      occasion,
      specialRequests,
      locationId: normalizedLocationId,
    })

    let session
    try {
      session = await createCheckoutSession({
        clover,
        customer: pending.customer,
        lineItems: pending.lineItems,
        orderId: pending.reservationId,
      })
    } catch (sessionError) {
      await cancelUnpaidPendingReservation(pending.reservationId, uid)
      throw sessionError
    }

    await attachReservationCheckoutSession(pending.reservationId, session.checkoutSessionId)

    res.json({
      reservationId: pending.reservationId,
      feeCents: pending.feeCents,
      href: session.href,
      checkoutSessionId: session.checkoutSessionId,
      expirationTime: session.expirationTime,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start reservation checkout'
    const status =
      message.includes('required') ||
      message.includes('Date') ||
      message.includes('Party') ||
      message.includes('Fully booked') ||
      message.includes('advance')
        ? 400
        : 500
    res.status(status).json({ error: message })
  }
})
