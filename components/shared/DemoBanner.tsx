import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { isFirebaseConfigured } from '../../lib/firebase'
import { colors, spacing } from '../../constants/theme'

export function DemoBanner() {
  if (isFirebaseConfigured) return null
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        ⚙️ Demo mode — add Firebase keys to .env to enable live data
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.3)',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  text: { color: colors.goldLight, fontSize: 11, fontWeight: '600' },
})
