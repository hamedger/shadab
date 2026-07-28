import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { LocationsSection } from '../../components/home/LocationsSection'
import { colors } from '../../constants/theme'

export default function LocationsScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LocationsSection />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
})
