import { getFunctions, httpsCallable } from 'firebase/functions'
import app from './firebase'

const functions = getFunctions(app, 'us-central1')

export const getRecommendations = httpsCallable<
  { userId: string; locationId: string },
  { itemIds: string[] }
>(functions, 'getAIRecommendations')
