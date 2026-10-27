import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ReservationDatePicker } from '../components/reservation/ReservationDatePicker'
import {
  BREAKFAST_AND_24_HOURS_START_LABEL,
  BREAKFAST_START_DATE,
  getReservationBlockFullMessage,
  getReservationBlockId,
  getReservationSeatsLeft,
  isMealReservable,
  RESERVABLE_MEALS,
} from '../constants/buffetSchedule'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'
import { useReservation } from '../hooks/useReservation'
import { useReservationCapacity } from '../hooks/useReservationCapacity'
import { useFullyReserved } from '../hooks/useFullyReserved'
import { FULLY_RESERVED_MESSAGE, FullyReservedNotice } from '../components/shared/FullyReservedNotice'
import { MAX_ADVANCE_DAYS } from '../lib/services/reservationService'
import { formatBuffetTime, getMealStatusesForDate } from '../lib/services/buffetService'
import {
  BuffetMeal,
  CANCELLATION_POLICY_TEXT,
  LARGE_PARTY_GRATUITY_MIN_GUESTS,
  LARGE_PARTY_GRATUITY_PERCENT,
  LARGE_PARTY_GRATUITY_TEXT,
  getReservationSlots,
  hasReservationNotice,
  RESERVATION_MIN_NOTICE_LABEL,
  getReservationStartMs,
  getReservationSubtotalCents,
  getReservationTaxCents,
  GRAND_OPENING_START,
  isMealServedOn,
  PAY_AT_RESTAURANT_POLICY_TEXT,
  RESERVATION_PREPAYMENT_ENABLED,
  RESTAURANT_TAX_RATE,
} from '../constants/reservation'
import { formatReservationNumber } from '../lib/admin/reservationAdmin'
import type { PayAtRestaurantReservation } from '../lib/services/reservationCheckout'
import {
  BUFFET_MEALS,
  getBuffetMealPriceCents,
  getChildBuffetPriceCents,
  getRestaurantNow,
  OPENING_DAY_FIRST_MEAL,
} from '../constants/buffetSchedule'

const HEADER_IMAGE = require('../assets/flyers/reserve-header.jpg')
const HEADER_ASPECT = 1024 / 618

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const STEPS = [
  { icon: 'timer-outline' as const, label: 'Quick & easy reservation' },
  RESERVATION_PREPAYMENT_ENABLED
    ? { icon: 'phone-portrait-outline' as const, label: 'Reserve & pay online' }
    : { icon: 'phone-portrait-outline' as const, label: 'Reserve online, pay at the restaurant' },
  { icon: 'restaurant-outline' as const, label: 'Come & enjoy your food right away' },
]

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatLongDate(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Shown in place of the form once a pay-at-restaurant reservation is saved. */
function BookedConfirmation({ reservation }: { reservation: PayAtRestaurantReservation }) {
  const guests = [
    `${reservation.adults} adult${reservation.adults === 1 ? '' : 's'}`,
    reservation.children ? `${reservation.children} kid${reservation.children === 1 ? '' : 's'} 4–10` : '',
    reservation.infants ? `${reservation.infants} under 4` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <View style={styles.confirmBox} accessibilityLiveRegion="polite">
      <Ionicons name="checkmark-circle" size={48} color={colors.gold} />
      <Text style={styles.heading} accessibilityRole="header">
        Your table is reserved
      </Text>
      <Text style={styles.confirmNumber}>Reservation #{formatReservationNumber(reservation.id)}</Text>
      <View style={styles.confirmDetails}>
        <Text style={styles.confirmLine}>{BUFFET_MEALS[reservation.meal].label} Buffet</Text>
        <Text style={styles.confirmLine}>
          {formatLongDate(reservation.date)} at {reservation.time}
        </Text>
        <Text style={styles.confirmLine}>
          Party of {reservation.partySize} ({guests})
        </Text>
        <Text style={styles.noticeTotal}>Estimated total {formatCents(reservation.estimatedTotalCents)}</Text>
        {reservation.partySize >= LARGE_PARTY_GRATUITY_MIN_GUESTS ? (
          <Text style={styles.confirmLine}>+ {LARGE_PARTY_GRATUITY_PERCENT}% gratuity added at the restaurant</Text>
        ) : null}
      </View>
      <Text style={styles.noticeText}>{PAY_AT_RESTAURANT_POLICY_TEXT}</Text>
      <Text style={styles.noticeText}>
        At the host stand, give your name or reservation number. Screenshot this page to keep it handy.
      </Text>
    </View>
  )
}

function Stepper({
  label,
  hint,
  value,
  min,
  onChange,
}: {
  label: string
  hint: string
  value: number
  min: number
  onChange: (n: number) => void
}) {
  return (
    <View style={styles.stepperRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepperLabel}>{label}</Text>
        <Text style={styles.stepperHint}>{hint}</Text>
      </View>
      <TouchableOpacity
        style={[styles.stepperBtn, value <= min && styles.stepperBtnDisabled]}
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        accessibilityRole="button"
        accessibilityLabel={`Fewer ${label.toLowerCase()}`}
      >
        <Ionicons name="remove" size={18} color={colors.gold} />
      </TouchableOpacity>
      <Text style={styles.stepperValue} accessibilityLiveRegion="polite">
        {value}
      </Text>
      <TouchableOpacity
        style={styles.stepperBtn}
        onPress={() => onChange(value + 1)}
        accessibilityRole="button"
        accessibilityLabel={`More ${label.toLowerCase()}`}
      >
        <Ionicons name="add" size={18} color={colors.gold} />
      </TouchableOpacity>
    </View>
  )
}

export default function ReservationScreen() {
  const { width } = useWindowDimensions()
  const { submit, loading, error, booked, defaultName, defaultPhone } = useReservation()

  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState(defaultPhone)
  // Pre-select when only one buffet is bookable (dinner, while breakfast and lunch are coming soon).
  const [meal, setMeal] = useState<BuffetMeal | ''>(RESERVABLE_MEALS.length === 1 ? RESERVABLE_MEALS[0] : '')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    if (defaultName && !name) setName(defaultName)
    if (defaultPhone && !phone) setPhone(defaultPhone)
  }, [defaultName, defaultPhone])

  const hasDate = DATE_RE.test(date)
  const today = getRestaurantNow().dateString
  const priceDate = hasDate ? date : today < GRAND_OPENING_START ? GRAND_OPENING_START : today
  const mealOptions = useMemo(() => getMealStatusesForDate(priceDate), [priceDate])

  // Hide seatings less than 2 hours away — online bookings need that much notice.
  const slots = useMemo(() => {
    if (!meal) return []
    const all = getReservationSlots(meal)
    if (!hasDate) return all
    const now = Date.now()
    return all.filter((slot) => hasReservationNotice(getReservationStartMs(date, meal, slot) ?? 0, now))
  }, [meal, date, hasDate])

  useEffect(() => {
    if (time && !slots.includes(time)) setTime('')
  }, [slots, time])

  // Each 90-minute block seats 100 guests; times whose block can't fit this party are disabled.
  const bookedByBlock = useReservationCapacity(hasDate ? date : '', meal)
  const partySize = adults + children
  const seatsLeftFor = (slot: string) => {
    const blockId = meal && hasDate ? getReservationBlockId(date, meal, slot) : null
    return getReservationSeatsLeft(blockId ? bookedByBlock[blockId] ?? 0 : 0)
  }
  const selectedSeatsLeft = time ? seatsLeftFor(time) : null
  const selectedTimeTooSmall = selectedSeatsLeft !== null && partySize > selectedSeatsLeft

  // Staff can mark today fully reserved in admin; other dates stay bookable.
  const { fullyReservedDate } = useFullyReserved()
  const dateFullyReserved = hasDate && date === fullyReservedDate

  const mealUnavailable = Boolean(meal && hasDate && !isMealServedOn(date, meal))
  const guests = { adults, children, infants: 0 }
  const adultCents = meal ? getBuffetMealPriceCents(priceDate, meal) : 0
  const childCents = getChildBuffetPriceCents(adultCents)
  const subtotal = meal ? getReservationSubtotalCents(priceDate, meal, guests) : null
  const tax = subtotal != null ? getReservationTaxCents(subtotal) : 0
  const total = subtotal != null ? subtotal + tax : null

  const handleSubmit = async () => {
    try {
      await submit({
        name,
        phone,
        meal,
        adults,
        children,
        infants: 0,
        date,
        time,
      })
      // Prepaid: the hook redirects to Clover Hosted Checkout. Pay at restaurant: `booked` is set.
    } catch {
      // error surfaced via hook
    }
  }

  const headerWidth = Math.min(width, 720)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Image
        source={HEADER_IMAGE}
        style={{ width: headerWidth, height: headerWidth / HEADER_ASPECT, alignSelf: 'center' }}
        contentFit="cover"
        accessibilityLabel="Shadab Restaurant & Grill — we highly recommend everyone to reserve your table"
      />

      {booked ? (
        <View style={styles.content}>
          <BookedConfirmation reservation={booked} />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.heading} accessibilityRole="header">
            Reserve Your Table
          </Text>
          <Text style={styles.subtitle}>
            Reserve in advance to guarantee your dining experience and skip the wait — fast, easy, and
            hassle-free.
          </Text>

          <FullyReservedNotice style={{ marginBottom: spacing.md }} />

          <View style={styles.warning}>
            <Ionicons name="calendar-outline" size={16} color={colors.white} />
            <Text style={styles.warningText}>No reservation = seating not guaranteed</Text>
          </View>

          <View style={styles.steps}>
            {STEPS.map((step) => (
              <View key={step.label} style={styles.step}>
                <Ionicons name={step.icon} size={22} color={colors.gold} />
                <Text style={styles.stepText}>{step.label}</Text>
              </View>
            ))}
          </View>

          {error && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>Choose your buffet *</Text>
          <View style={styles.mealGrid}>
            {mealOptions.filter((option) => isMealReservable(option.meal)).map((option) => {
              const selected = meal === option.meal
              const unavailable = hasDate && !isMealServedOn(date, option.meal)
              return (
                <TouchableOpacity
                  key={option.meal}
                  style={[styles.mealCard, selected && styles.chipActive, unavailable && styles.mealCardDisabled]}
                  onPress={() => setMeal(option.meal)}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: unavailable }}
                >
                  <Text style={[styles.mealName, selected && styles.chipTextActive]}>{option.label}</Text>
                  <Text style={styles.mealHours}>{option.hoursLabel}</Text>
                  <View style={styles.mealPriceRow}>
                    <Text style={styles.mealPrice}>{formatCents(option.priceCents)}</Text>
                    {option.isSpecial ? (
                      <Text style={styles.mealRegular}>{formatCents(option.regularPriceCents)}</Text>
                    ) : null}
                  </View>
                  {unavailable ? (
                    <Text style={styles.mealNote}>Not served this day</Text>
                  ) : null}
                </TouchableOpacity>
              )
            })}
          </View>
          {mealUnavailable ? (
            <Text style={styles.inlineError}>
              {meal === 'breakfast' && date < BREAKFAST_START_DATE
                ? `Breakfast buffet starts ${BREAKFAST_AND_24_HOURS_START_LABEL} — pick another meal or a later date.`
                : `Opening day (${GRAND_OPENING_START}) starts with ${OPENING_DAY_FIRST_MEAL} at ${formatBuffetTime(BUFFET_MEALS[OPENING_DAY_FIRST_MEAL].start)} — pick a later meal or another date.`}
            </Text>
          ) : null}

          <ReservationDatePicker
            value={date}
            onChange={setDate}
            maxAdvanceDays={MAX_ADVANCE_DAYS}
            disabledDates={fullyReservedDate ? [fullyReservedDate] : []}
          />
          {dateFullyReserved ? (
            <Text style={styles.inlineError}>{FULLY_RESERVED_MESSAGE} for this date — please pick another date.</Text>
          ) : null}

          <Text style={styles.fieldLabel}>Seating Time *</Text>
          {meal ? (
            <View style={styles.timeGrid}>
              {slots.map((slot) => {
                const seatsLeft = seatsLeftFor(slot)
                const full = partySize > seatsLeft
                const selected = time === slot
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.timeChip, selected && styles.chipActive, full && !selected && styles.mealCardDisabled]}
                    onPress={() => setTime(slot)}
                    disabled={full && !selected}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: full && !selected }}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{slot}</Text>
                    {full ? (
                      <Text style={styles.chipNote}>{seatsLeft > 0 ? `${seatsLeft} left` : 'Full'}</Text>
                    ) : null}
                  </TouchableOpacity>
                )
              })}
              {slots.length === 0 ? (
                <Text style={styles.helper}>No seatings left for this meal today — reservations need {RESERVATION_MIN_NOTICE_LABEL}' notice. Pick another meal or date.</Text>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.helper, { marginBottom: spacing.md }]}>Choose the dinner buffet first. Breakfast and lunch buffets coming soon.</Text>
          )}
          {selectedTimeTooSmall ? (
            <Text style={styles.inlineError}>{getReservationBlockFullMessage(selectedSeatsLeft ?? 0)}.</Text>
          ) : null}

          <Text style={styles.fieldLabel}>Guests *</Text>
          <View style={styles.guestBox}>
            <Stepper label="Adults" hint="Ages 11+" value={adults} min={1} onChange={setAdults} />
            <Stepper label="Kids 4–10" hint="Half price" value={children} min={0} onChange={setChildren} />
          </View>

          <Input label="Full Name *" value={name} onChangeText={setName} placeholder="Your name" />
          <Input
            label="Cell Phone *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="We'll call or text if anything changes"
          />

          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>
              {RESERVATION_PREPAYMENT_ENABLED ? 'Pay for your buffet now' : 'Estimated buffet total — pay at the restaurant'}
            </Text>
            {meal ? (
              <>
                <Text style={styles.noticeText}>
                  {adults} adult{adults === 1 ? '' : 's'} × {formatCents(adultCents)}
                  {children > 0 ? `  ·  ${children} kid${children === 1 ? '' : 's'} 4–10 × ${formatCents(childCents)}` : ''}
                </Text>
                <Text style={styles.noticeText}>
                  Subtotal {formatCents(subtotal ?? 0)}  ·  Tax ({(RESTAURANT_TAX_RATE * 100).toFixed(2)}%) {formatCents(tax)}
                </Text>
                <Text style={styles.noticeTotal}>Total {formatCents(total ?? 0)}</Text>
                {partySize >= LARGE_PARTY_GRATUITY_MIN_GUESTS ? (
                  <Text style={styles.noticeText}>+ {LARGE_PARTY_GRATUITY_PERCENT}% gratuity added at the restaurant for your party of {partySize}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.noticeText}>
                {RESERVATION_PREPAYMENT_ENABLED
                  ? 'Your reservation prepays the full buffet price for your party plus tax, paid securely by Clover.'
                  : 'Choose a meal to see the estimated buffet price for your party plus tax.'}
              </Text>
            )}
            <Text style={styles.noticeText}>{LARGE_PARTY_GRATUITY_TEXT}</Text>
            <Text style={styles.noticeText}>
              {RESERVATION_PREPAYMENT_ENABLED ? CANCELLATION_POLICY_TEXT : PAY_AT_RESTAURANT_POLICY_TEXT}
            </Text>
          </View>

          <Button
            label={
              RESERVATION_PREPAYMENT_ENABLED
                ? total != null
                  ? `Continue to Payment · ${formatCents(total)}`
                  : 'Continue to Payment'
                : 'Reserve Table'
            }
            onPress={handleSubmit}
            loading={loading}
            disabled={mealUnavailable || selectedTimeTooSmall || dateFullyReserved}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.md }}
          />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },
  content: { padding: spacing.lg, maxWidth: 720, width: '100%', alignSelf: 'center' },
  heading: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: '#9b1c1c',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  warningText: { fontFamily: fonts.sansBold, color: colors.white, fontSize: 13 },
  steps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  step: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    backgroundColor: colors.backgroundCard,
  },
  stepText: { flex: 1, fontFamily: fonts.sansMedium, color: colors.white, fontSize: 12 },
  noticeBox: {
    backgroundColor: 'rgba(201,162,75,0.1)',
    borderWidth: 1,
    borderColor: colors.goldDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  noticeTitle: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 14,
  },
  noticeText: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  confirmBox: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.goldDark,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  confirmNumber: { fontFamily: fonts.sansBold, color: colors.gold, fontSize: 18, letterSpacing: 1 },
  confirmDetails: { alignItems: 'center', gap: spacing.xs, marginVertical: spacing.sm },
  confirmLine: { fontFamily: fonts.sansMedium, color: colors.white, fontSize: 15, textAlign: 'center' },
  noticeTotal: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239,83,80,0.12)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { fontFamily: fonts.sans, color: colors.error, fontSize: 13 },
  inlineError: { fontFamily: fonts.sans, color: colors.error, fontSize: 12, marginBottom: spacing.md },
  helper: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12 },
  fieldLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  mealGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  mealCard: {
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    gap: 2,
  },
  mealCardDisabled: { opacity: 0.5 },
  mealName: { fontFamily: fonts.sansBold, color: colors.white, fontSize: 15 },
  mealHours: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12 },
  mealPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs },
  mealPrice: { fontFamily: fonts.sansBold, color: colors.gold, fontSize: 18 },
  mealRegular: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  mealNote: { fontFamily: fonts.sans, color: colors.error, fontSize: 11 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
  },
  guestBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  stepperLabel: { fontFamily: fonts.sansMedium, color: colors.white, fontSize: 14 },
  stepperHint: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 11 },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: { opacity: 0.35 },
  stepperValue: {
    minWidth: 24,
    textAlign: 'center',
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
  },
  chipActive: { backgroundColor: 'rgba(201,162,75,0.15)', borderColor: colors.gold },
  chipText: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12 },
  chipNote: { fontFamily: fonts.sans, color: colors.error, fontSize: 10, textAlign: 'center' },
  chipTextActive: { fontFamily: fonts.sansBold, color: colors.gold },
})
