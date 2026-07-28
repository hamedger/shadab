import React, { useEffect } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated'
import { Logo } from './Logo'
import { colors } from '../../constants/theme'

const { width, height } = Dimensions.get('window')

export function SplashLogo() {
  const opacity = useSharedValue(0)
  const glow = useSharedValue(0)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.4, { duration: 1200 }),
      ),
      -1,
      true,
    )
  }, [])

  const logoStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.25 }))

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowCircle, glowStyle]} />
      <Animated.View style={logoStyle}>
        <Logo variant="full" height={80} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.gold,
  },
})
