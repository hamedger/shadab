import React, { useMemo, useState } from 'react'
import { Modal as RNModal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { GRAND_OPENING_START } from '../../constants/buffet'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface ReservationDatePickerProps {
  value: string
  onChange: (date: string) => void
  maxAdvanceDays?: number
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function toDateString(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function parseDateString(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return new Date(`${s}T12:00:00`)
}

export function ReservationDatePicker({ value, onChange, maxAdvanceDays = 30 }: ReservationDatePickerProps) {
  const [visible, setVisible] = useState(false)
  const today = useMemo(() => startOfDay(new Date()), [])
  const bookingStart = useMemo(() => {
    const grandOpening = parseDateString(GRAND_OPENING_START) ?? today
    return isAfter(grandOpening, today) ? startOfDay(grandOpening) : today
  }, [today])
  const maxDate = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + maxAdvanceDays)
    return d
  }, [today, maxAdvanceDays])

  const selected = parseDateString(value)
  const [viewMonth, setViewMonth] = useState(() => selected ?? bookingStart)

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewMonth)
    const monthEnd = endOfMonth(viewMonth)
    const gridStart = startOfWeek(monthStart)
    const gridEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [viewMonth])

  const canGoPrev = isAfter(startOfMonth(viewMonth), startOfMonth(bookingStart))
  const canGoNext = isBefore(startOfMonth(viewMonth), startOfMonth(maxDate))

  const openModal = () => {
    setViewMonth(selected ?? bookingStart)
    setVisible(true)
  }

  const handleSelect = (day: Date) => {
    onChange(toDateString(day))
    setVisible(false)
  }

  const label = selected ? format(selected, 'EEEE, MMMM d, yyyy') : 'Select a date'

  return (
    <>
      <Text style={styles.fieldLabel}>Date *</Text>
      <TouchableOpacity style={styles.field} onPress={openModal} accessibilityRole="button">
        <Ionicons name="calendar-outline" size={18} color={colors.gold} />
        <Text style={[styles.fieldText, !selected && styles.fieldPlaceholder]}>{label}</Text>
      </TouchableOpacity>

      <RNModal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        />
        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={styles.popup}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Select a Date</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={18} color={colors.whiteMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthRow}>
              <TouchableOpacity
                onPress={() => canGoPrev && setViewMonth((m) => subMonths(m, 1))}
                disabled={!canGoPrev}
                style={styles.navBtn}
              >
                <Ionicons name="chevron-back" size={18} color={canGoPrev ? colors.gold : colors.border} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{format(viewMonth, 'MMMM yyyy')}</Text>
              <TouchableOpacity
                onPress={() => canGoNext && setViewMonth((m) => addMonths(m, 1))}
                disabled={!canGoNext}
                style={styles.navBtn}
              >
                <Ionicons name="chevron-forward" size={18} color={canGoNext ? colors.gold : colors.border} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((w, i) => (
                <Text key={i} style={styles.weekdayLabel}>{w}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((day) => {
                const inMonth = isSameMonth(day, viewMonth)
                const outOfRange = isBefore(day, bookingStart) || isAfter(day, maxDate)
                const disabled = !inMonth || outOfRange
                const isSelected = selected ? isSameDay(day, selected) : false

                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[styles.day, isSelected && styles.daySelected]}
                    onPress={() => !disabled && handleSelect(day)}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inMonth && styles.dayTextMuted,
                        disabled && inMonth && styles.dayTextDisabled,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Text style={styles.hint}>
              Booking opens {format(bookingStart, 'MMM d')} · open every day
            </Text>
          </View>
        </View>
      </RNModal>
    </>
  )
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  fieldText: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 14,
  },
  fieldPlaceholder: {
    color: colors.whiteMuted,
    fontFamily: fonts.sans,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  popup: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  popupTitle: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 14,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navBtn: { padding: spacing.xs },
  monthLabel: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 15,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  daySelected: {
    backgroundColor: colors.gold,
  },
  dayText: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 13,
  },
  dayTextMuted: {
    color: colors.border,
  },
  dayTextDisabled: {
    color: colors.whiteMuted,
    opacity: 0.35,
  },
  dayTextSelected: {
    color: colors.background,
    fontFamily: fonts.sansBold,
  },
  hint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
})
