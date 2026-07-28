import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MenuItem } from '../../types/menu'
import { setMenuAvailability } from '../../lib/admin/menuAdmin'
import { getMenuItemAvailability } from '../../lib/menuMerge'
import { formatCents } from '../../lib/admin/stats'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface AdminMenuItemRowProps {
  item: MenuItem
  locationId: string
  categoryLabel?: string
  onPress: () => void
  onStockChange?: () => void
}

export function AdminMenuItemRow({
  item,
  locationId,
  categoryLabel,
  onPress,
  onStockChange,
}: AdminMenuItemRowProps) {
  const [busy, setBusy] = useState(false)
  const inStock = getMenuItemAvailability(item, locationId)

  const toggleStock = async (next: boolean) => {
    setBusy(true)
    try {
      await setMenuAvailability(item.id, next, locationId, item)
      onStockChange?.()
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Could not update stock')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={[styles.row, !inStock && styles.rowOut]}>
      <TouchableOpacity style={styles.main} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.textBlock}>
          <Text style={[styles.name, !inStock && styles.nameOut]} numberOfLines={2}>
            {item.name}
          </Text>
          {categoryLabel ? <Text style={styles.category}>{categoryLabel}</Text> : null}
        </View>
        <Text style={styles.price}>{formatCents(item.price)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.whiteMuted} />
      </TouchableOpacity>

      <View style={styles.stockCol}>
        {busy ? (
          <ActivityIndicator size="small" color={colors.gold} />
        ) : (
          <>
            <Text style={[styles.stockLabel, !inStock && styles.stockLabelOut]}>
              {inStock ? 'In stock' : 'Sold out'}
            </Text>
            <Switch
              value={inStock}
              onValueChange={toggleStock}
              disabled={busy}
              thumbColor={inStock ? colors.gold : colors.whiteMuted}
              trackColor={{ true: colors.goldDark, false: colors.border }}
            />
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundCard,
  },
  rowOut: {
    opacity: 0.72,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 14,
    lineHeight: 18,
  },
  nameOut: {
    color: colors.whiteMuted,
  },
  category: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    marginTop: 2,
  },
  price: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 13,
  },
  stockCol: {
    alignItems: 'center',
    width: 72,
    gap: 2,
  },
  stockLabel: {
    fontFamily: fonts.sans,
    color: colors.greenLight,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stockLabelOut: {
    color: colors.error,
  },
})
