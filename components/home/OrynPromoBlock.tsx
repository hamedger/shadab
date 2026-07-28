import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

const DEMO_MAILTO = 'mailto:info@orynsolutions.io?subject=Demo%20request'

export function OrynPromoBlock() {
  const requestDemo = () => {
    Linking.openURL(DEMO_MAILTO)
  }

  return (
    <View style={styles.section}>
      <Text style={styles.headline}>Restaurant ordering, built for growth</Text>
      <Text style={styles.subtext}>
        This platform was designed and built by ORYN INC. for Shadab.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={requestDemo}
        accessibilityRole="link"
        accessibilityLabel="Request a demo from ORYN INC"
        {...(Platform.OS === 'web' ? { accessibilityHint: 'Opens your email client' } : {})}
      >
        <Text style={styles.buttonText}>Request a demo</Text>
      </TouchableOpacity>
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
  headline: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtext: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
    maxWidth: 420,
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
})
