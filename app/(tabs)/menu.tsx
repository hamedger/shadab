import React from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { MenuCatalog } from '../../components/menu/MenuCatalog'
import { CloverOrderButtons } from '../../components/menu/CloverOrderButtons'
import { ONLINE_ORDERING_ENABLED } from '../../constants/config'
import { useCloverOrdering } from '../../hooks/useCloverOrdering'
import { colors, spacing } from '../../constants/theme'

const ORDER_BAR_MAX = 640

export default function MenuScreen() {
  const clover = useCloverOrdering()
  return (
    <View style={styles.root}>
      <View style={styles.catalog}>
        <MenuCatalog />
      </View>
      {/* Food orders go to the location's Clover Online Ordering page (Admin → Locations). */}
      {!ONLINE_ORDERING_ENABLED && clover.url ? (
        <View style={styles.orderBar}>
          <View style={styles.orderBarInner}>
            <CloverOrderButtons orderingUrl={clover.url} />
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { minHeight: 0, height: '100%' as const } : null),
  },
  catalog: {
    flex: 1,
    minHeight: 0,
  },
  orderBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  orderBarInner: {
    width: '100%',
    maxWidth: ORDER_BAR_MAX,
  },
})
