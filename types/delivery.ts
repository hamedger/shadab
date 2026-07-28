export interface DeliveryQuote {
  fee: number
  distanceMiles: number
  etaMinutes: number
  currency: string
}

export interface DeliveryQuoteRequest {
  dropoffStreet: string
  dropoffCity: string
  dropoffState?: string
  dropoffZip: string
  locationId: string
}
