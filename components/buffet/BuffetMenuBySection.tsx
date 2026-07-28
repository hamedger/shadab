import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BuffetDish } from '../../types/buffet'
import { BuffetSectionGroup } from '../../lib/buffetLayout'
import { isBuffetDishServing } from '../../lib/services/buffetService'
import { colors, spacing, fonts } from '../../constants/theme'

function DishRow({ dish }: { dish: BuffetDish }) {
  const serving = isBuffetDishServing(dish)

  return (
    <View style={[styles.dishRow, !serving && styles.dishRowOut]}>
      <View style={[styles.vegMark, dish.isVegetarian && styles.vegMarkActive, !serving && styles.vegMarkOut]}>
        {dish.isVegetarian && <View style={styles.vegDot} />}
      </View>
      <Text style={[styles.dishName, !serving && styles.dishNameOut]}>{dish.name}</Text>
      {!serving ? <Text style={styles.soldOutTag}>Out of stock</Text> : null}
      {serving && dish.isNew ? <Text style={styles.newTag}>New</Text> : null}
    </View>
  )
}

interface BuffetMenuBySectionProps {
  sections: BuffetSectionGroup[]
  emptyMessage?: string
}

export function BuffetMenuBySection({
  sections,
  emptyMessage = "Today's buffet menu will be posted shortly.",
}: BuffetMenuBySectionProps) {
  const hasDishes = sections.some((s) => s.dishes.length > 0)

  if (!hasDishes) {
    return <Text style={styles.emptyDishes}>{emptyMessage}</Text>
  }

  return (
    <View style={styles.wrap}>
      {sections.map((section) =>
        section.dishes.length === 0 ? null : (
          <View key={section.id} style={styles.sectionBlock}>
            <Text style={styles.categoryTitle}>{section.title}</Text>
            {section.dishes.map((dish) => (
              <DishRow key={dish.menuItemId} dish={dish} />
            ))}
          </View>
        ),
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  sectionBlock: { gap: 0 },
  categoryTitle: {
    fontFamily: fonts.sansBold,
    color: colors.goldLight,
    fontSize: 14,
    letterSpacing: 0.3,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  dishRowOut: {
    opacity: 0.72,
  },
  vegMark: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vegMarkActive: { borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  dishName: { flex: 1, fontFamily: fonts.serif, color: colors.white, fontSize: 15 },
  dishNameOut: { color: colors.whiteMuted },
  soldOutTag: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  vegMarkOut: {
    opacity: 0.55,
  },
  newTag: { fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  emptyDishes: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
  },
})
