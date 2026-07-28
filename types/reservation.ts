import { Timestamp } from 'firebase/firestore'

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Reservation {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  partySize: number
  date: string
  time: string
  occasion?: string
  specialRequests?: string
  locationId: string
  status: ReservationStatus
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}
