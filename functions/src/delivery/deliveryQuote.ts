import * as functions from 'firebase-functions/v2'
import { computeDeliveryFee } from './deliveryPricing'

const DEFAULT_ETA_MINUTES = 35

export const deliveryQuote = functions.https.onCall(async (request) => {
  const { auth, data } = request
  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')

  const {
    dropoffStreet,
    dropoffCity,
    dropoffState = 'IL',
    dropoffZip,
    locationId,
  } = data as {
    dropoffStreet?: string
    dropoffCity?: string
    dropoffState?: string
    dropoffZip?: string
    locationId?: string
  }

  const street = String(dropoffStreet ?? '').trim()
  const city = String(dropoffCity ?? '').trim()
  const zip = String(dropoffZip ?? '').trim()

  if (!street || !city || !zip) {
    throw new functions.https.HttpsError('invalid-argument', 'Complete delivery address is required')
  }

  try {
    const { feeCents, distanceMiles } = await computeDeliveryFee({
      locationId: String(locationId ?? 'chicago-il'),
      deliveryAddress: { street, city, state: String(dropoffState ?? 'IL').trim(), zip },
    })

    return {
      fee: feeCents,
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      etaMinutes: DEFAULT_ETA_MINUTES,
      currency: 'USD',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to get a delivery quote'
    throw new functions.https.HttpsError('failed-precondition', message)
  }
})
