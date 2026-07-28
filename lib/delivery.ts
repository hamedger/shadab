import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'
import app from './firebase'

const functions = getFunctions(app, 'us-central1')

if (process.env.EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR === 'true') {
  const host = process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST ?? '127.0.0.1'
  const port = Number(process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_PORT ?? 5001)
  try {
    connectFunctionsEmulator(functions, host, port)
  } catch {
    // emulator already connected (hot reload)
  }
}

export const getDeliveryQuote = httpsCallable(functions, 'deliveryQuote')
