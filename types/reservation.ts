import { Timestamp } from 'firebase/firestore'
import type { BuffetMeal } from '../constants/buffetSchedule'

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Reservation {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  partySize: number
  /** Older reservations (before the 3-meal buffet) have no meal; treat as dinner. */
  meal?: BuffetMeal
  adults?: number
  /** Ages 5–10, half price. */
  children?: number
  /** Under 5, free. */
  infants?: number
  date: string
  time: string
  occasion?: string
  specialRequests?: string
  locationId: string
  status: ReservationStatus
  /** Amount prepaid at booking (100% of the buffet for the party). */
  feeCents?: number
  /** Seating time as epoch ms (server-computed, America/Chicago). */
  startsAtMs?: number
  cancellationFeeCents?: number
  refundCents?: number
  cancelledAt?: Timestamp | null
  /** Set by the host stand when the guest arrives; a checked-in reservation can't be reused. */
  checkedInAt?: Timestamp | null
  cloverMerchantId?: string
  cloverCheckoutSessionId?: string
  cloverPaymentId?: string
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}
