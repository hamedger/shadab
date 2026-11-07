import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BUFFET_MEALS, RESERVABLE_MEALS, getWalkInNote } from '../../constants/buffetSchedule'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

/**
 * When each buffet takes reservations and when it switches to walk-ins, e.g.
 * "Breakfast: Reservations until 10 AM · 10 AM–1 PM first come, first served".
 */
export function WalkInNotice({ style }: { style?: StyleProp<ViewStyle> }) {
  const lines = RESERVABLE_MEALS.flatMap((meal) => {
    const note = getWalkInNote(meal)
    return note ? [{ meal, label: BUFFET_MEALS[meal].label, note }] : []
  })
  if (lines.length === 0) return null

  return (
    <View style={[styles.box, style]} accessibilityRole="summary">
      <View style={styles.titleRow}>
        <Ionicons name="time-outline" size={18} color={colors.gold} />
        <Text style={styles.title}>Reservation hours</Text>
      </View>
      {lines.map((line) => (
        <Text key={line.meal} style={styles.line}>
          <Text style={styles.meal}>{line.label}: </Text>
          {line.note}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    gap: spacing.xs,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  title: { fontFamily: fonts.sansBold, color: colors.gold, fontSize: 15, textAlign: 'center' },
  line: { fontFamily: fonts.sans, color: colors.white, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  meal: { fontFamily: fonts.sansBold, color: colors.white },
})
