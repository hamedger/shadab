import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { BuffetHero } from './BuffetHero'
import { FeaturedDishes } from './FeaturedDishes'
import { ConversionSection } from './ConversionSection'
import { OrynPromoBlock } from './OrynPromoBlock'
import { DemoBanner } from '../shared/DemoBanner'
import { OperationalUpdatePoster } from './OperationalUpdatePoster'
import { colors } from '../../constants/theme'

export function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <DemoBanner />

      <OperationalUpdatePoster />

      <BuffetHero />
      <FeaturedDishes />
      <OrynPromoBlock />
      <ConversionSection />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
})
