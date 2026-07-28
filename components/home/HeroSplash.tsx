import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { HERO_SPLASH_DISHES, HERO_SPLASH_INTERVAL_MS } from '../../constants/heroSplash'
import { colors, spacing, fonts } from '../../constants/theme'

const PHOTO_ASPECT = 16 / 9
const BG = colors.background

interface HeroSplashProps {
  width: number
}

export function HeroSplash({ width }: HeroSplashProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const photoHeight = width / PHOTO_ASPECT
  const dish = HERO_SPLASH_DISHES[activeIndex]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % HERO_SPLASH_DISHES.length)
    }, HERO_SPLASH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const goTo = (index: number) => setActiveIndex(index)

  return (
    <View
      style={[styles.frame, { width, height: photoHeight }]}
      accessibilityRole="image"
      accessibilityLabel={`${dish.name}, featured Hyderabadi dish`}
    >
      <Image
        key={dish.id}
        source={dish.source}
        style={styles.photo}
        contentFit="cover"
        transition={700}
        accessibilityIgnoresInvertColors
      />

      <LinearGradient
        colors={['transparent', 'rgba(12, 10, 8, 0.5)', BG]}
        locations={[0.55, 0.88, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[BG, 'transparent']}
        locations={[0, 0.06]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', BG]}
        locations={[0.94, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <Text style={styles.dishName} numberOfLines={2}>
          {dish.name}
        </Text>
        <View style={styles.dots}>
          {HERO_SPLASH_DISHES.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => goTo(index)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Show ${item.name}`}
              accessibilityState={{ selected: index === activeIndex }}
            >
              <View style={[styles.dot, index === activeIndex && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: BG,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dishName: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.35)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.gold,
  },
})
