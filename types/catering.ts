import { Timestamp } from 'firebase/firestore'

export type CateringStatus = 'pending' | 'contacted' | 'confirmed' | 'declined'

export interface CateringInquiry {
  id: string
  name: string
  email: string
  phone: string
  eventDate: string
  eventType?: string
  location?: string
  headcount: number
  budget?: string
  dietary?: string
  details?: string
  status: CateringStatus
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}
