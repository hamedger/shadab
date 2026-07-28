import { getFunctions, httpsCallable } from 'firebase/functions'
import app from './firebase'

const functions = getFunctions(app, 'us-central1')

export const refreshGrowthInsights = httpsCallable<
  { locationId?: string; useAI?: boolean },
  { headline: string; source: 'ai' | 'rules'; generatedAt: string }
>(functions, 'refreshGrowthInsights')

export const askGrowthCopilot = httpsCallable<
  { question: string; locationId?: string },
  { answer: string; source: 'ai' | 'rules' }
>(functions, 'askGrowthCopilot')
