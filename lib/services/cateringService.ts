import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

export interface CateringInput {
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
}

export interface CateringValidationResult {
  valid: boolean
  errors: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MIN_ADVANCE_HOURS = 48

export const CATERING_EVENT_TYPES = [
  'Corporate Event',
  'Wedding',
  'Birthday',
  'Religious Gathering',
  'Community Event',
  'Other',
] as const

export function validateCatering(input: CateringInput): CateringValidationResult {
  const errors: string[] = []

  if (!input.name.trim()) errors.push('Name is required')
  if (!input.email.trim() || !EMAIL_RE.test(input.email.trim())) errors.push('Valid email is required')
  if (!input.phone.trim() || input.phone.replace(/\D/g, '').length < 10) {
    errors.push('Valid phone number is required')
  }
  if (!input.eventDate.trim() || !DATE_RE.test(input.eventDate.trim())) {
    errors.push('Event date must be YYYY-MM-DD')
  } else {
    const eventDate = new Date(`${input.eventDate}T12:00:00`)
    const minDate = new Date()
    minDate.setHours(minDate.getHours() + MIN_ADVANCE_HOURS)
    if (eventDate < minDate) {
      errors.push(`Events require at least ${MIN_ADVANCE_HOURS} hours advance notice`)
    }
  }
  if (!input.headcount || input.headcount < 10) {
    errors.push('Minimum headcount is 10 guests for catering')
  }

  return { valid: errors.length === 0, errors }
}

export async function submitCateringInquiry(input: CateringInput): Promise<string> {
  const validation = validateCatering(input)
  if (!validation.valid) {
    throw new Error(validation.errors[0])
  }

  if (!isFirebaseConfigured) {
    await new Promise((r) => setTimeout(r, 600))
    return `demo-catering-${Date.now()}`
  }

  const docRef = await addDoc(collection(db, 'catering_inquiries'), {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    eventDate: input.eventDate.trim(),
    eventType: input.eventType?.trim() ?? '',
    location: input.location?.trim() ?? '',
    headcount: input.headcount,
    budget: input.budget?.trim() ?? '',
    dietary: input.dietary?.trim() ?? '',
    details: input.details?.trim() ?? '',
    status: 'pending',
    createdAt: serverTimestamp(),
  })

  return docRef.id
}
