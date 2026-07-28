import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native'
import { useAllLocations } from '../../hooks/useLocations'
import { saveLocation, updateLocation } from '../../lib/admin/locationAdmin'
import { formatLocationAddress } from '../../lib/locationUtils'
import { Location } from '../../types/location'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

const EMPTY_FORM = {
  id: '',
  name: '',
  street: '',
  city: '',
  state: 'MI',
  zip: '',
  phone: '',
  isActive: true,
  acceptsDelivery: true,
  acceptsPickup: true,
  pickupPrepBufferMinutes: '30',
}

export default function AdminLocationsScreen() {
  const { locations, loading } = useAllLocations()
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const editingLocation = useMemo(
    () => locations.find((l) => l.id === editingId) ?? null,
    [locations, editingId],
  )

  const startCreate = () => {
    setEditingId('__new__')
    setForm(EMPTY_FORM)
  }

  const startEdit = (location: Location) => {
    setEditingId(location.id)
    setForm({
      id: location.id,
      name: location.name,
      street: location.address.street,
      city: location.address.city,
      state: location.address.state,
      zip: location.address.zip,
      phone: location.phone,
      isActive: location.isActive,
      acceptsDelivery: location.acceptsDelivery,
      acceptsPickup: location.acceptsPickup,
      pickupPrepBufferMinutes: String(location.pickupPrepBufferMinutes ?? 30),
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.street.trim() || !form.city.trim() || !form.zip.trim()) {
      Alert.alert('Missing fields', 'Name, street, city, and ZIP are required.')
      return
    }

    const pickupPrepBufferMinutes = parseInt(form.pickupPrepBufferMinutes, 10)
    if (!Number.isFinite(pickupPrepBufferMinutes) || pickupPrepBufferMinutes < 5) {
      Alert.alert('Invalid buffer', 'Pickup prep buffer must be at least 5 minutes.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        id: form.id.trim() || undefined,
        name: form.name.trim(),
        phone: form.phone.trim(),
        isActive: form.isActive,
        acceptsDelivery: form.acceptsDelivery,
        acceptsPickup: form.acceptsPickup,
        pickupPrepBufferMinutes,
        acceptsReservations: true,
        acceptsCatering: true,
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim() || 'MI',
          zip: form.zip.trim(),
          country: 'US',
        },
      }

      if (editingId === '__new__') {
        const newId = await saveLocation(payload)
        Alert.alert('Location added', `Location "${form.name}" is now available (${newId}).`)
      } else if (editingId) {
        await updateLocation(editingId, payload)
        Alert.alert('Saved', 'Location updated.')
      }
      cancelEdit()
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save location')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (location: Location) => {
    try {
      await updateLocation(location.id, { isActive: !location.isActive })
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Could not update location')
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Locations</Text>
          <Text style={styles.subheading}>Manage stores for online ordering</Text>
        </View>
        <Button label="Add location" size="sm" onPress={startCreate} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          {editingId ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingId === '__new__' ? 'New location' : `Edit ${editingLocation?.name ?? ''}`}
              </Text>
              {editingId === '__new__' ? (
                <Input
                  label="Location ID (optional)"
                  value={form.id}
                  onChangeText={(id) => setForm((f) => ({ ...f, id }))}
                  placeholder="troy-mi"
                  autoCapitalize="none"
                />
              ) : null}
              <Input
                label="Display name"
                value={form.name}
                onChangeText={(name) => setForm((f) => ({ ...f, name }))}
                placeholder="Shadab — Chicago"
              />
              <Input
                label="Street"
                value={form.street}
                onChangeText={(street) => setForm((f) => ({ ...f, street }))}
              />
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Input
                    label="City"
                    value={form.city}
                    onChangeText={(city) => setForm((f) => ({ ...f, city }))}
                  />
                </View>
                <View style={styles.stateField}>
                  <Input
                    label="State"
                    value={form.state}
                    onChangeText={(state) => setForm((f) => ({ ...f, state }))}
                  />
                </View>
              </View>
              <Input
                label="ZIP"
                value={form.zip}
                onChangeText={(zip) => setForm((f) => ({ ...f, zip }))}
                keyboardType="number-pad"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChangeText={(phone) => setForm((f) => ({ ...f, phone }))}
                placeholder="+12485551234"
              />
              <Input
                label="Pickup prep buffer (minutes)"
                value={form.pickupPrepBufferMinutes}
                onChangeText={(pickupPrepBufferMinutes) =>
                  setForm((f) => ({ ...f, pickupPrepBufferMinutes }))
                }
                keyboardType="number-pad"
                placeholder="30"
              />
              <Text style={styles.bufferHint}>
                Earliest same-day pickup slot is this many minutes after the current time.
              </Text>
              <ToggleRow
                label="Active (visible to customers)"
                value={form.isActive}
                onValueChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
              />
              <ToggleRow
                label="Accepts delivery"
                value={form.acceptsDelivery}
                onValueChange={(acceptsDelivery) => setForm((f) => ({ ...f, acceptsDelivery }))}
              />
              <ToggleRow
                label="Accepts pickup"
                value={form.acceptsPickup}
                onValueChange={(acceptsPickup) => setForm((f) => ({ ...f, acceptsPickup }))}
              />
              <View style={styles.formActions}>
                <Button label="Cancel" variant="ghost" onPress={cancelEdit} />
                <Button label="Save location" onPress={handleSave} loading={saving} />
              </View>
            </View>
          ) : null}

          {locations.length === 0 ? (
            <Text style={styles.empty}>No locations yet. Add your first store.</Text>
          ) : (
            locations.map((location) => (
              <View key={location.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName}>{location.name}</Text>
                    <Text style={styles.cardMeta}>{formatLocationAddress(location.address)}</Text>
                    <Text style={styles.cardMeta}>
                      Pickup buffer: {location.pickupPrepBufferMinutes ?? 30} min
                    </Text>
                    <Text style={styles.cardId}>ID: {location.id}</Text>
                  </View>
                  <Switch
                    value={location.isActive}
                    onValueChange={() => toggleActive(location)}
                    trackColor={{ false: colors.border, true: colors.goldDark }}
                    thumbColor={location.isActive ? colors.gold : colors.whiteMuted}
                  />
                </View>
                <View style={styles.cardActions}>
                  <Button label="Edit" size="sm" variant="secondary" onPress={() => startEdit(location)} />
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  )
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string
  value: boolean
  onValueChange: (v: boolean) => void
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.goldDark }}
        thumbColor={value ? colors.gold : colors.whiteMuted}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heading: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 28,
  },
  subheading: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    marginTop: 4,
  },
  empty: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
  },
  formCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formTitle: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  stateField: { width: 88 },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardBody: { flex: 1, gap: 4 },
  cardName: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
  },
  cardMeta: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  bufferHint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
  cardId: {
    fontFamily: fonts.sans,
    color: colors.goldLight,
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 14,
    flex: 1,
    paddingRight: spacing.md,
  },
})
