import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { colors, spacing, borderRadius, fonts } from '../constants/theme'
import { useCatering } from '../hooks/useCatering'
import { CATERING_EVENT_TYPES } from '../lib/services/cateringService'

export default function CateringScreen() {
  const router = useRouter()
  const { submit, loading, error } = useCatering()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventType, setEventType] = useState('')
  const [location, setLocation] = useState('')
  const [headcount, setHeadcount] = useState('')
  const [budget, setBudget] = useState('')
  const [dietary, setDietary] = useState('')
  const [details, setDetails] = useState('')

  const handleSubmit = async () => {
    try {
      await submit({
        name,
        email,
        phone,
        eventDate,
        eventType,
        location,
        headcount: parseInt(headcount, 10) || 0,
        budget,
        dietary,
        details,
      })
      Alert.alert('Inquiry Sent', 'Our catering team will follow up within 24 hours.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch {
      // error surfaced via hook
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Catering Inquiry</Text>
      <Text style={styles.subtitle}>
        48-hour minimum advance notice · Our team will follow up to confirm menu and pricing
      </Text>

      {error && (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Input label="Your Name *" value={name} onChangeText={setName} placeholder="Contact person" />
      <Input label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Input label="Phone *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input label="Event Date *" value={eventDate} onChangeText={setEventDate} placeholder="YYYY-MM-DD" />

      <Text style={styles.fieldLabel}>Event Type</Text>
      <View style={styles.typeGrid}>
        {CATERING_EVENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeChip, eventType === type && styles.chipActive]}
            onPress={() => setEventType(eventType === type ? '' : type)}
          >
            <Text style={[styles.chipText, eventType === type && styles.chipTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input label="Event Location" value={location} onChangeText={setLocation} placeholder="Address or venue name" />
      <Input label="Headcount *" value={headcount} onChangeText={setHeadcount} keyboardType="number-pad" placeholder="Minimum 10 guests" />
      <Input label="Budget (approx.)" value={budget} onChangeText={setBudget} placeholder="e.g. $500–$1,000" />
      <Input label="Dietary Restrictions" value={dietary} onChangeText={setDietary} placeholder="Vegetarian, nut-free, etc." />
      <Input label="Additional Details" value={details} onChangeText={setDetails} placeholder="Cuisine preferences, special requests..." multiline numberOfLines={4} />

      <Button label="Send Catering Inquiry" onPress={handleSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: spacing.md }} />
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
    lineHeight: 20,
    marginBottom: spacing.lg,
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
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
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
})
