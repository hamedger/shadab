import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Location } from '../../types/location'
import { formatLocationAddress, formatPhoneDisplay } from '../../lib/locationUtils'
import { LocationPickerModal } from './LocationPickerModal'
import { useLocationSelection } from '../../hooks/useLocationSelection'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface LocationConfirmCardProps {
  location: Location
  locations: Location[]
  selectedLocationId: string
  loading?: boolean
}

export function LocationConfirmCard({
  location,
  locations,
  selectedLocationId,
  loading = false,
}: LocationConfirmCardProps) {
  const { selectLocation } = useLocationSelection()
  const [open, setOpen] = useState(false)

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="storefront-outline" size={20} color={colors.gold} />
          <Text style={styles.title}>Ordering from</Text>
        </View>
        <Text style={styles.name}>{location.name}</Text>
        <Text style={styles.address}>{formatLocationAddress(location.address)}</Text>
        <Text style={styles.phone}>{formatPhoneDisplay(location.phone)}</Text>
        <TouchableOpacity style={styles.changeBtn} onPress={() => setOpen(true)}>
          <Text style={styles.changeText}>Change location</Text>
        </TouchableOpacity>
      </View>

      <LocationPickerModal
        visible={open}
        locations={locations}
        selectedLocationId={selectedLocationId}
        loading={loading}
        title="Change ordering location"
        onSelect={(id) => {
          selectLocation(id, () => setOpen(false))
        }}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.md,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
  },
  address: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  phone: {
    fontFamily: fonts.sans,
    color: colors.goldLight,
    fontSize: 12,
  },
  changeBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  changeText: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
})
