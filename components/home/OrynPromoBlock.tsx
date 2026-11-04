import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

const ORYN_URL = 'https://orynsolutions.io/'
const DEMO_MAILTO = 'mailto:info@orynsolutions.io?subject=Restaurant%20website%20demo%20(from%20shadab.io)'

/** "Powered by ORYN" credit, aimed at other restaurant owners who visit the site. */
export function OrynPromoBlock() {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>Powered by ORYN</Text>
      <Text style={styles.headline}>
        Run a smarter buffet — reservations, deposits and refills in one system
      </Text>
      <Text style={styles.subtext}>
        ORYN built Shadab&apos;s website, buffet reservations with deposits, and OBI — ORYN Buffet
        Intelligence — which tracks every refill and shows how fast the kitchen responds. Production
        and waste insights coming soon.
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL(ORYN_URL)}
          accessibilityRole="link"
          accessibilityLabel="See what ORYN builds for restaurants, opens orynsolutions.io"
        >
          <Text style={styles.buttonText}>See what ORYN builds →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL(DEMO_MAILTO)}
          accessibilityRole="link"
          accessibilityLabel="Book a demo with ORYN by email"
        >
          <Text style={styles.secondaryLink}>Book a demo</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  headline: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: spacing.sm,
    maxWidth: 760,
  },
  subtext: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
    maxWidth: 440,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  buttonText: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  secondaryLink: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
})
