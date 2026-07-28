import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'
import { useReservation } from '../hooks/useReservation'
import {
  MIN_RESERVATION_PARTY_SIZE,
  RESERVATION_TIME_SLOTS,
} from '../lib/services/reservationService'

const PARTY_SIZES = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, '21+',
] as const
const OCCASIONS = ['Birthday', 'Anniversary', 'Business Dinner', 'Date Night', 'Family Gathering', 'Other']

export default function ReservationScreen() {
  const router = useRouter()
  const { submit, loading, error, defaultName, defaultEmail, defaultPhone } = useReservation()

  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState(defaultPhone)
  const [partySize, setPartySize] = useState(MIN_RESERVATION_PARTY_SIZE)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [occasion, setOccasion] = useState('')
  const [requests, setRequests] = useState('')

  useEffect(() => {
    if (defaultName && !name) setName(defaultName)
    if (defaultEmail && !email) setEmail(defaultEmail)
    if (defaultPhone && !phone) setPhone(defaultPhone)
  }, [defaultName, defaultEmail, defaultPhone])

  const handleSubmit = async () => {
    if (partySize > 20) {
      Alert.alert('Large Party', 'For parties over 20, please use our Catering inquiry form.', [
        { text: 'Go to Catering', onPress: () => router.push('/catering' as never) },
        { text: 'Cancel', style: 'cancel' },
      ])
      return
    }

    try {
      await submit({ name, email, phone, partySize, date, time, occasion, specialRequests: requests })
      Alert.alert(
        'Reservation Submitted',
        "We'll confirm your reservation within 30 minutes. Check your email for updates.",
        [{ text: 'OK', onPress: () => router.back() }],
      )
    } catch {
      // error surfaced via hook
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Reserve Your Table</Text>
      <Text style={styles.subtitle}>Book up to 30 days in advance · 15-minute seating slots</Text>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Parties of {MIN_RESERVATION_PARTY_SIZE} or more</Text>
        <Text style={styles.noticeText}>
          Table reservations are available for groups of {MIN_RESERVATION_PARTY_SIZE} guests and up.
          For smaller parties, walk in or order online. For parties over 20, use our catering form.
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
      <Input label="Date *" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

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

      <Text style={styles.fieldLabel}>Party Size * (minimum {MIN_RESERVATION_PARTY_SIZE})</Text>
      <View style={styles.sizeGrid}>
        {PARTY_SIZES.map((s) => {
          const value = typeof s === 'number' ? s : 21
          const selected = partySize === value
          return (
            <TouchableOpacity
              key={String(s)}
              style={[styles.sizeChip, selected && styles.sizeChipActive]}
              onPress={() => setPartySize(value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.sizeText, selected && styles.sizeTextActive]}>{s}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

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
        label="Submit Reservation"
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
    backgroundColor: 'rgba(212,175,55,0.1)',
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
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  sizeChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
  },
  sizeChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  sizeText: { fontFamily: fonts.sansBold, color: colors.whiteMuted },
  sizeTextActive: { color: colors.background },
  occasionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  occasionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
  },
  chipActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: colors.gold },
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
