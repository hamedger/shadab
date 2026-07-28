import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { RESTAURANT_STATS } from '../../constants/home'
import { colors, spacing, fonts } from '../../constants/theme'

export function StatsStrip() {
  return (
    <View style={styles.container} accessibilityRole="summary">
      {RESTAURANT_STATS.map((stat, index) => (
        <React.Fragment key={stat.label}>
          {index > 0 && <View style={styles.divider} />}
          <View style={styles.stat}>
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  value: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 16,
    marginBottom: 2,
  },
  label: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
})
