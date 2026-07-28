import { Platform } from 'react-native'

/** Clears DOM focus on web so hidden routes (aria-hidden) do not trap focus. */
export function blurActiveElementOnWeb() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return
  const active = document.activeElement
  if (active instanceof HTMLElement) {
    active.blur()
  }
}
