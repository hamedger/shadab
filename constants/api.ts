/** Render Clover checkout API — override with EXPO_PUBLIC_API_URL for local/staging. */
export const DEFAULT_API_URL = 'https://shadab-api.onrender.com'
export const LOCAL_API_URL = 'http://localhost:3001'

function resolveApiUrl(): string {
  // Local emulators → local Clover API (Render blocks localhost CORS). Dev builds only, so a
  // production export from a machine whose .env has the emulator flag still uses Render.
  if (__DEV__ && process.env.EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR === 'true') {
    return LOCAL_API_URL
  }
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim()
  return fromEnv || DEFAULT_API_URL
}

export function getApiUrl(): string {
  return resolveApiUrl().replace(/\/$/, '')
}

export function isApiConfigured(): boolean {
  return resolveApiUrl().length > 0
}
