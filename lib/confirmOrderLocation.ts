import { Alert, Platform } from 'react-native'
import { Location } from '../types/location'
import { formatLocationAddress } from './locationUtils'

export function confirmOrderLocation(location: Location): Promise<boolean> {
  const address = formatLocationAddress(location.address)
  const message = `Your order will be prepared at ${location.name}.\n\n${address}`

  if (Platform.OS === 'web') {
    return Promise.resolve(
      typeof window !== 'undefined' &&
        window.confirm(`${message}\n\nPlace this order?`),
    )
  }

  return new Promise((resolve) => {
    Alert.alert(
      'Confirm ordering location',
      message,
      [
        { text: 'Go back', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Place Order', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    )
  })
}
