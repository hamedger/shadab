import React from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { MenuCatalog } from '../../components/menu/MenuCatalog'
import { colors } from '../../constants/theme'

export default function MenuScreen() {
  return (
    <View style={styles.root}>
      <MenuCatalog />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { minHeight: 0, height: '100%' as const } : null),
  },
})
