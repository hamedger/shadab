import React from 'react'
import { Image } from 'expo-image'
import { StyleSheet } from 'react-native'

interface TabHomeIconProps {
  focused: boolean
  size: number
}

const ICON = require('../../assets/home-tab-icon.svg')

export function TabHomeIcon({ focused, size }: TabHomeIconProps) {
  const dimension = Math.round(size + 2)

  return (
    <Image
      source={ICON}
      style={[
        styles.icon,
        {
          width: dimension,
          height: dimension,
          opacity: focused ? 1 : 0.45,
        },
      ]}
      contentFit="contain"
      accessibilityLabel="Home"
    />
  )
}

const styles = StyleSheet.create({
  icon: {
    alignSelf: 'center',
  },
})
