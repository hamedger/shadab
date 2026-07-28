import { Alert, Platform } from 'react-native'

type AlertButton = {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

export function alertUser(title: string, message: string, buttons?: AlertButton[]) {
  if (Platform.OS === 'web') {
    if (!buttons?.length) {
      window.alert(`${title}\n\n${message}`)
      return
    }

    const primary = buttons.find((b) => b.style !== 'cancel') ?? buttons[0]
    const cancel = buttons.find((b) => b.style === 'cancel')

    if (cancel && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`)
      if (confirmed) primary.onPress?.()
      else cancel.onPress?.()
      return
    }

    window.alert(`${title}\n\n${message}`)
    primary.onPress?.()
    return
  }

  Alert.alert(title, message, buttons)
}
