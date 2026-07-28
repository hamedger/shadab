export const MOCK_DELIVERY_FEE_CENTS = 599
export const MOCK_DELIVERY_ETA_MINUTES = 35
export const MOCK_PICKUP_ETA_MINUTES = 20

export const TIP_PERCENT_OPTIONS = [15, 20, 30] as const
export type TipPercent = (typeof TIP_PERCENT_OPTIONS)[number]

/** Delivery-only tip presets (pickup keeps TIP_PERCENT_OPTIONS above). */
export const DELIVERY_TIP_PERCENT_OPTIONS = [20, 25, 30] as const
export const MIN_CUSTOM_TIP_PERCENT = 10

export const CONTENT_MAX_WIDTH = 640
