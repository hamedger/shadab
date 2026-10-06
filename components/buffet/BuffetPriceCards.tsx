import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BuffetMeal } from '../../constants/buffetSchedule'
import { BuffetMealStatus } from '../../types/buffet'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

const MEAL_ICONS: Record<BuffetMeal, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'wine-outline',
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

interface BuffetPriceCardsProps {
  meals: BuffetMealStatus[]
  /** Highlights the meal being served right now. */
  currentMeal?: BuffetMeal | null
}

/** Breakfast / lunch / dinner cards with hours, price, and crossed-out regular price during specials. */
export function BuffetPriceCards({ meals, currentMeal }: BuffetPriceCardsProps) {
  return (
    <View style={styles.row}>
      {meals.map((m) => {
        const live = currentMeal === m.meal
        return (
          <View key={m.meal} style={[styles.card, live && styles.cardLive]}>
            <View style={styles.titleRow}>
              <Ionicons name={MEAL_ICONS[m.meal]} size={18} color={colors.gold} />
              <Text style={styles.title}>{m.label} Buffet</Text>
            </View>
            <Text style={styles.everyDay}>Every day</Text>
            <Text style={styles.hours}>{m.hoursLabel}</Text>
            <Text style={styles.price}>{formatCents(m.priceCents)}</Text>
            <Text style={styles.regular}>
              Regular price{' '}
              <Text style={m.isSpecial ? styles.regularStruck : undefined}>
                {formatCents(m.regularPriceCents)}
              </Text>
            </Text>
            {m.meal === 'dinner' ? <Text style={styles.badge}>40+ items</Text> : null}
            {live ? <Text style={styles.liveTag}>Serving now</Text> : null}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    minWidth: 180,
    maxWidth: 260,
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  cardLive: { borderColor: colors.greenLight },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  everyDay: { fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 12 },
  hours: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 13, marginBottom: spacing.xs },
  price: { fontFamily: fonts.sansBold, color: colors.goldLight, fontSize: 30 },
  regular: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12 },
  regularStruck: { textDecorationLine: 'line-through' },
  badge: {
    marginTop: spacing.xs,
    fontFamily: fonts.sansBold,
    color: colors.white,
    backgroundColor: '#9b1c1c',
    fontSize: 11,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  liveTag: { marginTop: spacing.xs, fontFamily: fonts.sansBold, color: colors.greenLight, fontSize: 11 },
})
