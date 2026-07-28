import { getFunctions, httpsCallable } from 'firebase/functions'
import app from './firebase'

const functions = getFunctions(app, 'us-central1')

export const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent')
export const confirmGiftCard = httpsCallable(functions, 'confirmGiftCard')
