import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { HomeButton } from '../navigation/HomeButton'
import { colors, spacing } from '../../constants/theme'

const FORM_MAX_WIDTH = 420

interface AuthScreenProps {
  children: React.ReactNode
}

export function AuthScreen({ children }: AuthScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <HomeButton />
      </View>
      <View style={styles.form}>{children}</View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingBottom: spacing.xl,
  },
  topBar: {
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  form: {
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
})
