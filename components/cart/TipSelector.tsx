import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { FulfillmentType } from '../../types/order'
import {
  TIP_PERCENT_OPTIONS,
  DELIVERY_TIP_PERCENT_OPTIONS,
  MIN_CUSTOM_TIP_PERCENT,
} from '../../constants/checkout'
import { calculateTipFromPercent } from '../../lib/services/cartService'
import { Input } from '../ui/Input'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface TipSelectorProps {
  subtotal: number
  tipPercent: number | null
  tip: number
  fulfillmentType: FulfillmentType
  onSelectPercent: (percent: number | null) => void
  onSelectCustom: (amountCents: number) => void
}

export function TipSelector({
  subtotal,
  tipPercent,
  tip,
  fulfillmentType,
  onSelectPercent,
  onSelectCustom,
}: TipSelectorProps) {
  const isDelivery = fulfillmentType === 'delivery'
  const percentOptions = isDelivery ? DELIVERY_TIP_PERCENT_OPTIONS : TIP_PERCENT_OPTIONS
  const minCustomTip = Math.ceil(subtotal * (MIN_CUSTOM_TIP_PERCENT / 100))
  const isCustom = tipPercent === null && tip > 0

  const [customOpen, setCustomOpen] = useState(false)
  const [customText, setCustomText] = useState('')

  const hint = isDelivery ? 'Optional tip for your delivery driver' : 'Optional tip for the restaurant team'

  const openCustom = () => {
    setCustomText(isCustom ? (tip / 100).toFixed(2) : '')
    setCustomOpen(true)
  }

  const applyCustom = () => {
    const dollars = parseFloat(customText)
    if (!Number.isFinite(dollars) || dollars <= 0) return
    const amountCents = Math.max(Math.round(dollars * 100), minCustomTip)
    onSelectCustom(amountCents)
    setCustomOpen(false)
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Add a Tip</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.chip, tipPercent === null && tip === 0 && styles.chipActive]}
          onPress={() => {
            setCustomOpen(false)
            onSelectPercent(null)
          }}
        >
          <Text
            style={[
              styles.chipText,
              tipPercent === null && tip === 0 && styles.chipTextActive,
            ]}
          >
            No tip
          </Text>
        </TouchableOpacity>

        {percentOptions.map((percent) => {
          const amount = calculateTipFromPercent(subtotal, percent)
          const selected = tipPercent === percent

          return (
            <TouchableOpacity
              key={percent}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => {
                setCustomOpen(false)
                onSelectPercent(percent)
              }}
            >
              {isDelivery ? (
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  ${(amount / 100).toFixed(2)}
                </Text>
              ) : (
                <>
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                    {percent}%
                  </Text>
                  <Text style={[styles.chipAmount, selected && styles.chipTextActive]}>
                    ${(amount / 100).toFixed(2)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )
        })}

        {isDelivery && (
          <TouchableOpacity
            style={[styles.chip, (isCustom || customOpen) && styles.chipActive]}
            onPress={openCustom}
          >
            <Text style={[styles.chipText, (isCustom || customOpen) && styles.chipTextActive]}>
              Other
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isDelivery && customOpen ? (
        <View style={styles.customRow}>
          <View style={styles.customInputWrap}>
            <Input
              value={customText}
              onChangeText={setCustomText}
              keyboardType="decimal-pad"
              placeholder="0.00"
              onSubmitEditing={applyCustom}
              style={styles.customInput}
            />
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={applyCustom}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isDelivery && customOpen ? (
        <Text style={styles.minHint}>
          Minimum tip is {MIN_CUSTOM_TIP_PERCENT}% (${(minCustomTip / 100).toFixed(2)})
        </Text>
      ) : null}

      {tip > 0 && (
        <Text style={styles.applied}>
          Tip: ${(tip / 100).toFixed(2)}
          {!isDelivery && tipPercent != null ? ` (${tipPercent}%)` : ''}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  header: {
    gap: 2,
  },
  title: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 13,
  },
  hint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    minWidth: 72,
    alignItems: 'center',
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  chipText: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.gold,
  },
  chipAmount: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 10,
    marginTop: 1,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  customInputWrap: {
    flex: 1,
  },
  customInput: {
    marginBottom: 0,
  },
  applyBtn: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  applyBtnText: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 13,
  },
  minHint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    marginTop: -4,
  },
  applied: {
    fontFamily: fonts.sans,
    color: colors.greenLight,
    fontSize: 12,
  },
})
