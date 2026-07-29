import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ReservationDatePicker } from '../components/reservation/ReservationDatePicker'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'
import { useReservation } from '../hooks/useReservation'
import { MAX_ADVANCE_DAYS, RESERVATION_TIME_SLOTS } from '../lib/services/reservationService'
import { getReservationFeeCents, isGrandOpeningWindow } from '../constants/reservation'

const OCCASIONS = ['Birthday', 'Anniversary', 'Business Dinner', 'Date Night', 'Family Gathering', 'Other']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function ReservationScreen() {
  const { submit, loading, error, defaultName, defaultEmail, defaultPhone } = useReservation()

  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState(defaultPhone)
  const [partySize, setPartySize] = useState('2')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [occasion, setOccasion] = useState('')
  const [requests, setRequests] = useState('')

  useEffect(() => {
    if (defaultName && !name) setName(defaultName)
    if (defaultEmail && !email) setEmail(defaultEmail)
    if (defaultPhone && !phone) setPhone(defaultPhone)
  }, [defaultName, defaultEmail, defaultPhone])

  const fee = useMemo(() => {
    if (DATE_RE.test(date)) return getReservationFeeCents(date)
    return isGrandOpeningWindow() ? getReservationFeeCents(date || '') : null
  }, [date])

  const handleSubmit = async () => {
    const size = Math.max(1, Math.round(Number(partySize) || 1))
    try {
      await submit({ name, email, phone, partySize: size, date, time, occasion, specialRequests: requests })
      // On success the hook redirects to Clover Hosted Checkout — nothing left to do here.
    } catch {
      // error surfaced via hook
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Reserve Your Table</Text>
      <Text style={styles.subtitle}>
        Dinner buffet only, 5 – 9 PM · book up to {MAX_ADVANCE_DAYS} days in advance · 15-minute slots
      </Text>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>
          {DATE_RE.test(date)
            ? isGrandOpeningWindow(date)
              ? 'Grand Opening Week'
              : 'Reservation Fee'
            : 'Reservation Fee'}
        </Text>
        <Text style={styles.noticeText}>
          {fee != null
            ? `A ${formatCents(fee)} reservation fee applies, paid securely by Clover after you submit.`
            : 'Reservation fee: $9.99 through Aug 28 (grand opening week), $15.00 after — paid securely by Clover after you submit.'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Input label="Full Name *" value={name} onChangeText={setName} placeholder="Your name" />
      <Input label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="For confirmation" />
      <Input label="Phone *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="For updates" />
      <ReservationDatePicker value={date} onChange={setDate} maxAdvanceDays={MAX_ADVANCE_DAYS} />

      <Text style={styles.fieldLabel}>Preferred Time *</Text>
      <View style={styles.timeGrid}>
        {RESERVATION_TIME_SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[styles.timeChip, time === slot && styles.chipActive]}
            onPress={() => setTime(slot)}
            accessibilityRole="button"
            accessibilityState={{ selected: time === slot }}
          >
            <Text style={[styles.chipText, time === slot && styles.chipTextActive]}>{slot}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Party Size *"
        value={partySize}
        onChangeText={setPartySize}
        keyboardType="number-pad"
        placeholder="Number of guests"
      />

      <Text style={styles.fieldLabel}>Occasion</Text>
      <View style={styles.occasionGrid}>
        {OCCASIONS.map((o) => (
          <TouchableOpacity
            key={o}
            style={[styles.occasionChip, occasion === o && styles.chipActive]}
            onPress={() => setOccasion(occasion === o ? '' : o)}
          >
            <Text style={[styles.chipText, occasion === o && styles.chipTextActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Special Requests"
        value={requests}
        onChangeText={setRequests}
        placeholder="Dietary needs, allergies, seating preference..."
        multiline
        numberOfLines={3}
      />

      <Text style={styles.note}>24-hour cancellation policy applies</Text>

      <Button
        label={fee != null ? `Continue to Payment · ${formatCents(fee)}` : 'Continue to Payment'}
        onPress={handleSubmit}
        loading={loading}
        fullWidth
        size="lg"
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
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
    marginBottom: spacing.md,
  },
  noticeBox: {
    backgroundColor: 'rgba(201,162,75,0.1)',
    borderWidth: 1,
    borderColor: colors.goldDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
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
  errorBox: {
    backgroundColor: 'rgba(239,83,80,0.12)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { fontFamily: fonts.sans, color: colors.error, fontSize: 13 },
  fieldLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
  },
  occasionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  occasionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
  },
  chipActive: { backgroundColor: 'rgba(201,162,75,0.15)', borderColor: colors.gold },
  chipText: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12 },
  chipTextActive: { fontFamily: fonts.sansBold, color: colors.gold },
  note: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
})
