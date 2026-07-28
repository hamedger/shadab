import React from 'react'
import { Platform, StyleSheet, Text, TextStyle, StyleProp } from 'react-native'
import { DISH_PHOTO_DISCLAIMER } from '../../constants/menu'
import { colors, fonts, spacing } from '../../constants/theme'

type DishPhotoDisclaimerProps = {
  style?: StyleProp<TextStyle>
  compact?: boolean
}

export function DishPhotoDisclaimer({ style, compact = false }: DishPhotoDisclaimerProps) {
  return (
    <Text
      style={[
        styles.disclaimer,
        compact && styles.disclaimerCompact,
        Platform.OS === 'web' && !compact && styles.disclaimerWeb,
        style,
      ]}
    >
      <Text style={[styles.infoLabel, compact && styles.infoLabelCompact]}>Info: </Text>
      {DISH_PHOTO_DISCLAIMER}
    </Text>
  )
}

const styles = StyleSheet.create({
  disclaimer: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  disclaimerCompact: {
    fontSize: 9,
    lineHeight: 13,
    marginTop: 4,
  },
  disclaimerWeb: {
    fontSize: 12,
    lineHeight: 18,
  },
  infoLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
  },
  infoLabelCompact: {
    fontSize: 9,
  },
})
