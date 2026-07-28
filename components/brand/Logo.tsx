import React from 'react'
import { ImageStyle, StyleProp } from 'react-native'
import { Image } from 'expo-image'

export type LogoVariant = 'full' | 'icon' | 'text-only'

interface LogoProps {
  variant?: LogoVariant
  height?: number
  style?: StyleProp<ImageStyle>
}

const LOGO_FULL = require('../../assets/logo.png')
const LOGO_ICON = require('../../assets/icon.png')

/** Full wordmark aspect ratio (268×150 source art). */
const FULL_ASPECT = 268 / 150

const DEFAULT_HEIGHTS: Record<LogoVariant, number> = {
  full: 52,
  icon: 36,
  'text-only': 32,
}

export function Logo({ variant = 'full', height, style }: LogoProps) {
  const h = height ?? DEFAULT_HEIGHTS[variant]
  const isSquare = variant === 'icon'
  const width = isSquare ? h : h * FULL_ASPECT
  const source = isSquare ? LOGO_ICON : LOGO_FULL

  return (
    <Image
      source={source}
      style={[{ height: h, width }, style]}
      contentFit="contain"
      accessibilityLabel="Shadab"
    />
  )
}
