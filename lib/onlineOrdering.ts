import { Linking, Platform } from 'react-native'

/** Sends the guest to a location's Clover Online Ordering page (same tab on web). */
export function openCloverOnlineOrdering(url: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(url)
    return
  }
  void Linking.openURL(url)
}
