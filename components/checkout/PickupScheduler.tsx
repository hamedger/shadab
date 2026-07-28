import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { DEFAULT_LOCATION_ID, LOCATION_ORDER_FULFILLMENT_HOURS } from '../../constants/config'
import { MOCK_PICKUP_ETA_MINUTES } from '../../constants/checkout'
import {
  formatFulfillmentHoursLabel,
  getCustomPickupTimeInputBounds,
  getPickupDateOptions,
  getPickupTimeSlotsForDate,
  isCustomPickupTimeValid,
  isPresetPickupTime,
  pickupTimeFromInputValue,
  pickupTimeToInputValue,
  PICKUP_ASAP,
} from '../../lib/services/pickupScheduling'
import { FulfillmentType } from '../../types/order'
import { OrderFulfillmentHours } from '../../types/location'
import { Input } from '../ui/Input'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface PickupSchedulerProps {
  date: string
  time: string
  pickupAddress: string
  locationName?: string
  prepBufferMinutes?: number
  fulfillmentHours?: OrderFulfillmentHours
  fulfillmentType?: FulfillmentType
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
}

export function PickupScheduler({
  date,
  time,
  pickupAddress,
  locationName,
  prepBufferMinutes,
  fulfillmentHours,
  fulfillmentType = 'pickup',
  onDateChange,
  onTimeChange,
}: PickupSchedulerProps) {
  const bufferMinutes = prepBufferMinutes ?? 30
  const isDelivery = fulfillmentType === 'delivery'
  const scheduleNoun = isDelivery ? 'Delivery' : 'Pickup'
  const hoursLabel = formatFulfillmentHoursLabel(
    fulfillmentHours ?? LOCATION_ORDER_FULFILLMENT_HOURS[DEFAULT_LOCATION_ID],
  )
  const dateOptions = useMemo(() => getPickupDateOptions(), [])
  const timeSlots = useMemo(
    () => getPickupTimeSlotsForDate(date, bufferMinutes, fulfillmentHours),
    [date, bufferMinutes, fulfillmentHours],
  )
  const inputBounds = useMemo(
    () => getCustomPickupTimeInputBounds(date, bufferMinutes, fulfillmentHours),
    [date, bufferMinutes, fulfillmentHours],
  )
  const [customMode, setCustomMode] = useState(
    () => Boolean(time) && !isPresetPickupTime(time, fulfillmentHours),
  )

  const customSelected = customMode
  const customTimeInvalid =
    customMode &&
    Boolean(time) &&
    !isCustomPickupTimeValid(date, time, bufferMinutes, fulfillmentHours)

  useEffect(() => {
    if (time && !isPresetPickupTime(time, fulfillmentHours)) {
      setCustomMode(true)
    }
  }, [time, fulfillmentHours])

  useEffect(() => {
    if (!time || !isPresetPickupTime(time, fulfillmentHours)) return
    if (!timeSlots.includes(time as (typeof timeSlots)[number])) {
      onTimeChange(timeSlots[0] ?? '')
      setCustomMode(false)
    }
  }, [date, time, timeSlots, onTimeChange, fulfillmentHours])

  const handleCustomPress = () => {
    setCustomMode(true)
    if (!time || time === PICKUP_ASAP) {
      const normalized = pickupTimeFromInputValue(inputBounds.min)
      if (normalized) onTimeChange(normalized)
    }
  }

  const handleCustomInputChange = (rawValue: string) => {
    const normalized = pickupTimeFromInputValue(rawValue)
    if (normalized) {
      onTimeChange(normalized)
      return
    }
    onTimeChange(rawValue)
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.locationCard}>
        <Ionicons name="location-outline" size={20} color={colors.gold} />
        <View style={styles.locationBody}>
          <Text style={styles.locationTitle}>
            {isDelivery
              ? locationName
                ? `Delivery from ${locationName}`
                : 'Delivery from restaurant'
              : locationName
                ? `Pickup at ${locationName}`
                : 'Pickup at restaurant'}
          </Text>
          <Text style={styles.locationAddress}>{pickupAddress}</Text>
        </View>
      </View>

      <Text style={styles.fieldLabel}>{scheduleNoun} date</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {dateOptions.map((option) => {
          const selected = date === option.value
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.dateChip, selected && styles.chipActive]}
              onPress={() => onDateChange(option.value)}
            >
              <Text style={[styles.dateLabel, selected && styles.chipTextActive]}>
                {option.label}
              </Text>
              {option.label !== option.sublabel ? (
                <Text style={[styles.dateSub, selected && styles.chipSubActive]}>
                  {option.sublabel}
                </Text>
              ) : null}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <Text style={styles.fieldLabel}>{scheduleNoun} time</Text>
      <View style={styles.timeGrid}>
        {timeSlots.map((slot) => {
          const selected = !customMode && time === slot
          const isAsap = slot === PICKUP_ASAP
          return (
            <TouchableOpacity
              key={slot}
              style={[
                styles.timeChip,
                isAsap && styles.asapChip,
                selected && styles.chipActive,
              ]}
              onPress={() => {
                setCustomMode(false)
                onTimeChange(slot)
              }}
            >
              <Text style={[styles.timeText, selected && styles.chipTextActive]}>
                {isAsap ? `ASAP (~${MOCK_PICKUP_ETA_MINUTES} min)` : slot}
              </Text>
            </TouchableOpacity>
          )
        })}
        <TouchableOpacity
          style={[styles.timeChip, customSelected && styles.chipActive]}
          onPress={handleCustomPress}
        >
          <Text style={[styles.timeText, customSelected && styles.chipTextActive]}>
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {customMode ? (
        <View style={styles.customTimeWrap}>
          {Platform.OS === 'web' ? (
            <input
              type="time"
              value={pickupTimeToInputValue(time)}
              min={inputBounds.min}
              max={inputBounds.max}
              step={300}
              onChange={(event) => handleCustomInputChange(event.target.value)}
              style={{
                width: '100%',
                color: colors.white,
                backgroundColor: colors.backgroundSecondary,
                border: `1px solid ${customTimeInvalid ? colors.error : colors.border}`,
                borderRadius: borderRadius.md,
                padding: `${spacing.sm + 2}px ${spacing.md}px`,
                fontSize: 15,
                fontFamily: fonts.sans,
              }}
            />
          ) : (
            <Input
              label="Custom time"
              value={time === PICKUP_ASAP ? '' : time}
              onChangeText={handleCustomInputChange}
              placeholder="e.g. 6:45 PM"
              autoCapitalize="none"
              error={
                customTimeInvalid
                  ? `Choose a time at least ${bufferMinutes} min from now, between ${hoursLabel}.`
                  : undefined
              }
            />
          )}
          {Platform.OS === 'web' && customTimeInvalid ? (
            <Text style={styles.customError}>
              Choose a time at least {bufferMinutes} min from now, between {hoursLabel}.
            </Text>
          ) : null}
          {!customTimeInvalid && customMode ? (
            <Text style={styles.customHint}>Any time within restaurant hours for this date.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  locationCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  locationBody: { flex: 1, gap: 4 },
  locationTitle: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
  },
  locationAddress: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.xs,
  },
  dateRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dateChip: {
    minWidth: 88,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
  },
  dateLabel: {
    fontFamily: fonts.sansBold,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  dateSub: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    marginTop: 2,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
  },
  asapChip: {
    borderColor: colors.borderStrong,
  },
  chipActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: colors.gold,
  },
  timeText: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  chipTextActive: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
  },
  chipSubActive: {
    color: colors.goldLight,
  },
  customTimeWrap: {
    gap: spacing.xs,
  },
  customHint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
  },
  customError: {
    fontFamily: fonts.sans,
    color: colors.error,
    fontSize: 12,
  },
})
