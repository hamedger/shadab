import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { spacing } from '../../constants/theme'

const POSTER_IMAGE = require('../../assets/flyers/operational-update.jpg')
const POSTER_ASPECT = 1122 / 1402
const MAX_WIDTH = 560

/** Operational update flyer: dinner buffet only, 6:30 PM–1 AM, every day. */
export function OperationalUpdatePoster() {
  const { width } = useWindowDimensions()
  const imageWidth = Math.min(width - spacing.md * 2, MAX_WIDTH)

  return (
    <View style={styles.section}>
      <Image
        source={POSTER_IMAGE}
        style={{ width: imageWidth, height: imageWidth / POSTER_ASPECT }}
        contentFit="contain"
        accessibilityLabel="Shadab Restaurant & Grill operational update: we are currently operating with dinner buffet only, 6:30 PM to 1:00 AM, all 7 days a week. 2311 W Devon Ave, Chicago. 877-742-3222."
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
