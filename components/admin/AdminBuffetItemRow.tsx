import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { MenuItem } from '../../types/menu'
import { AdminBuffetRow } from '../../lib/buffetLayout'
import { isBuffetDishNeedsRefill, isBuffetDishServing } from '../../lib/services/buffetService'
import { colors, spacing, fonts } from '../../constants/theme'

const REFILL_OK = colors.green
const NEEDS_REFILL = colors.error

interface AdminBuffetItemRowProps {
  row: AdminBuffetRow
  refillBusy: boolean
  servingBusy: boolean
  onToggleRefill: (item: MenuItem) => void
  onRemoveFromBuffet: (item: MenuItem) => void
  onToggleServing: (menuItemId: string, next: boolean) => void
}

export function AdminBuffetItemRow({
  row,
  refillBusy,
  servingBusy,
  onToggleRefill,
  onRemoveFromBuffet,
  onToggleServing,
}: AdminBuffetItemRowProps) {
  const { menuItem, buffetDish, displayName } = row
  const onBuffet = !!buffetDish
  const needsRefill = buffetDish ? isBuffetDishNeedsRefill(buffetDish) : false
  const isServing = buffetDish ? isBuffetDishServing(buffetDish) : false
  const disabled = !menuItem

  return (
    <View
      style={[
        styles.itemRow,
        onBuffet && !needsRefill && styles.itemRowOk,
        onBuffet && needsRefill && styles.itemRowNeedsRefill,
        onBuffet && !isServing && styles.itemRowPaused,
        disabled && styles.itemRowMissing,
      ]}
    >
      {disabled ? (
        <View style={[styles.statusBtn, styles.statusDot, styles.statusMissing]} />
      ) : refillBusy ? (
        <ActivityIndicator size="small" color={colors.gold} style={styles.statusBtn} />
      ) : (
        <TouchableOpacity
          onPress={() => menuItem && onToggleRefill(menuItem)}
          onLongPress={() => menuItem && onBuffet && onRemoveFromBuffet(menuItem)}
          delayLongPress={450}
          style={[
            styles.statusBtn,
            styles.statusDot,
            onBuffet
              ? { backgroundColor: needsRefill ? NEEDS_REFILL : REFILL_OK }
              : styles.statusOffLine,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            onBuffet
              ? needsRefill
                ? `${displayName}, needs refill. Tap when restocked. Long press to remove from line.`
                : `${displayName}, stocked. Tap to request refill. Long press to remove from line.`
              : `${displayName}, not on today's line. Tap to add as stocked.`
          }
        />
      )}

      <View style={styles.itemBody}>
        <Text
          style={[styles.itemName, needsRefill && styles.itemNameNeedsRefill, disabled && styles.itemNameMissing]}
          numberOfLines={2}
        >
          {displayName}
        </Text>
        <Text style={styles.itemMeta}>
          {disabled
            ? 'Not in menu catalog yet'
            : menuItem.category.replace(/-/g, ' ')}
          {onBuffet
            ? needsRefill
              ? ' · needs refill · hold dot to remove'
              : isServing
                ? ' · serving now · hold dot to remove'
                : ' · hidden from customers · hold dot to remove'
            : ' · tap dot to add to today'}
        </Text>
      </View>

      {onBuffet && menuItem ? (
        servingBusy ? (
          <ActivityIndicator size="small" color={colors.gold} />
        ) : (
          <View style={styles.servingCol}>
            <Text style={[styles.servingLabel, !isServing && styles.servingLabelOff]}>
              {isServing ? 'Serving' : 'Off'}
            </Text>
            <Switch
              value={isServing}
              onValueChange={(v) => onToggleServing(menuItem.id, v)}
              thumbColor={isServing ? colors.gold : colors.whiteMuted}
              trackColor={{ true: colors.goldDark, false: colors.border }}
            />
          </View>
        )
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  itemRowOk: {
    backgroundColor: 'rgba(67, 160, 71, 0.06)',
  },
  itemRowNeedsRefill: {
    backgroundColor: 'rgba(239, 83, 80, 0.08)',
  },
  itemRowPaused: {
    opacity: 0.85,
  },
  itemRowMissing: {
    opacity: 0.55,
  },
  statusBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusMissing: {
    backgroundColor: colors.border,
  },
  statusOffLine: {
    backgroundColor: colors.borderStrong,
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemName: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 14,
  },
  itemNameNeedsRefill: {
    color: colors.error,
  },
  itemNameMissing: {
    color: colors.whiteMuted,
  },
  itemMeta: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  servingCol: {
    alignItems: 'center',
    width: 72,
    gap: 2,
  },
  servingLabel: {
    fontFamily: fonts.sans,
    color: colors.greenLight,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  servingLabelOff: {
    color: colors.whiteMuted,
  },
})
