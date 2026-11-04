import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { spacing } from '../../constants/theme'

const POSTER_IMAGE = require('../../assets/flyers/daily-service-hours.jpg')
const POSTER_ASPECT = 1122 / 1402
const MAX_WIDTH = 560

/** "We're back" daily service hours flyer: breakfast buffet, à la carte, dinner buffet, open 24 hours. */
export function OperationalUpdatePoster() {
  const { width } = useWindowDimensions()
  const imageWidth = Math.min(width - spacing.md * 2, MAX_WIDTH)

  return (
    <View style={styles.section}>
      <Image
        source={POSTER_IMAGE}
        style={{ width: imageWidth, height: imageWidth / POSTER_ASPECT }}
        contentFit="contain"
        accessibilityLabel="Shadab Restaurant & Grill — we're back! Daily service hours: breakfast buffet 7:00 AM to 1:00 PM, à la carte limited menu 1:00 PM to 6:00 PM, grand dinner buffet from 6:30 PM, à la carte limited menu overnight. Open 24 hours. 2311 W Devon Ave, Chicago. 877-742-3222. Shadab.io"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
})
