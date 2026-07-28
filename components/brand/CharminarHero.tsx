import React from 'react'
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../../constants/theme'

interface CharminarHeroProps {
  height?: number
}

export function CharminarHero({ height = 280 }: CharminarHeroProps) {
  return (
    <View style={[styles.container, { height }]} accessible={false} importantForAccessibility="no">
      <LinearGradient
        colors={['rgba(212,175,55,0.12)', 'rgba(12,10,8,0.95)', colors.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.archFrame}>
        <View style={styles.archTop} />
        <View style={styles.archPillarLeft} />
        <View style={styles.archPillarRight} />
        <View style={styles.archBase} />
      </View>
      <LinearGradient
        colors={['transparent', colors.background]}
        style={styles.bottomFade}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  archFrame: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: 0.25,
  },
  archTop: {
    width: 120,
    height: 80,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: colors.gold,
    marginBottom: -2,
  },
  archPillarLeft: {
    position: 'absolute',
    bottom: 40,
    left: '28%',
    width: 14,
    height: 120,
    backgroundColor: colors.goldDark,
    opacity: 0.6,
  },
  archPillarRight: {
    position: 'absolute',
    bottom: 40,
    right: '28%',
    width: 14,
    height: 120,
    backgroundColor: colors.goldDark,
    opacity: 0.6,
  },
  archBase: {
    width: '60%',
    height: 8,
    backgroundColor: colors.gold,
    opacity: 0.4,
    marginBottom: 48,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
})
