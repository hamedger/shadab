import React from 'react'
import { View, StyleSheet, ScrollView, ViewStyle, StyleProp } from 'react-native'
import { colors } from '../../constants/theme'

interface ScreenShellProps {
  children: React.ReactNode
  scroll?: boolean
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
}

export function ScreenShell({ children, scroll = true, style, contentStyle }: ScreenShellProps) {
  if (!scroll) {
    return (
      <View style={[styles.root, style]}>
        <View style={[styles.inner, contentStyle]}>{children}</View>
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.root, style]}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
})
