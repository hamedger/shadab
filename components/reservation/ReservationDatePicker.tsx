import React, { useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
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
import { Modal } from '../ui/Modal'
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
  const maxDate = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + maxAdvanceDays)
    return d
  }, [today, maxAdvanceDays])

  const selected = parseDateString(value)
  const [viewMonth, setViewMonth] = useState(() => selected ?? today)

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewMonth)
    const monthEnd = endOfMonth(viewMonth)
    const gridStart = startOfWeek(monthStart)
    const gridEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [viewMonth])

  const canGoPrev = isAfter(startOfMonth(viewMonth), startOfMonth(today))
  const canGoNext = isBefore(startOfMonth(viewMonth), startOfMonth(maxDate))

  const openModal = () => {
    setViewMonth(selected ?? today)
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

      <Modal visible={visible} onClose={() => setVisible(false)} title="Select a Date">
        <View style={styles.monthRow}>
          <TouchableOpacity
            onPress={() => canGoPrev && setViewMonth((m) => subMonths(m, 1))}
            disabled={!canGoPrev}
            style={styles.navBtn}
          >
            <Ionicons name="chevron-back" size={20} color={canGoPrev ? colors.gold : colors.border} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{format(viewMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity
            onPress={() => canGoNext && setViewMonth((m) => addMonths(m, 1))}
            disabled={!canGoNext}
            style={styles.navBtn}
          >
            <Ionicons name="chevron-forward" size={20} color={canGoNext ? colors.gold : colors.border} />
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
            const isSunday = day.getDay() === 0
            const outOfRange = isBefore(day, today) || isAfter(day, maxDate)
            const disabled = !inMonth || isSunday || outOfRange
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

        <Text style={styles.hint}>Closed Sundays · book up to {maxAdvanceDays} days ahead</Text>
      </Modal>
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
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.xs },
  monthLabel: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 16,
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
    fontSize: 11,
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
    fontSize: 14,
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
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
