import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { OrderOnlinePicker } from '../location/OrderOnlinePicker'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface ConversionCard {
  title: string
  description: string
  cta: string
  route: string
  accent?: boolean
}

const CONVERSION_CARDS: ConversionCard[] = [
  {
    title: 'Order Online',
    description: 'Order for pickup — browse our full Hyderabadi menu.',
    cta: 'Start Order',
    route: '/(tabs)/menu',
    accent: true,
  },
  {
    title: 'Reserve a Table',
    description: 'Dine in with family and friends. Book up to 30 days ahead.',
    cta: 'Make Reservation',
    route: '/reservation',
  },
  {
    title: 'Catering',
    description: 'Corporate events, weddings, and celebrations for 10+ guests.',
    cta: 'Get a Quote',
    route: '/catering',
  },
  {
    title: 'Loyalty Rewards',
    description: 'Earn points on every order. Unlock exclusive member perks.',
    cta: 'View Rewards',
    route: '/loyalty',
  },
]

export function ConversionSection() {
  const router = useRouter()

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Experience Shadab</Text>
      <View style={styles.divider} />
      {CONVERSION_CARDS.map((card) => (
        <View
          key={card.title}
          style={[styles.card, card.accent && styles.cardAccent]}
        >
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardDescription}>{card.description}</Text>
          {card.accent ? (
            <OrderOnlinePicker>
              {(startOrder) => (
                <TouchableOpacity
                  onPress={startOrder}
                  accessibilityRole="button"
                  accessibilityLabel={card.cta}
                >
                  <Text style={styles.cardCta}>{card.cta} →</Text>
                </TouchableOpacity>
              )}
            </OrderOnlinePicker>
          ) : (
            <TouchableOpacity
              onPress={() => router.push(card.route as never)}
              accessibilityRole="button"
              accessibilityLabel={card.cta}
            >
              <Text style={styles.cardCta}>{card.cta} →</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 22,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardAccent: {
    borderColor: colors.borderStrong,
  },
  cardTitle: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cardCta: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
})
