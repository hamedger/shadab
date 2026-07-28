import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatBusinessHours } from '../../constants/home'
import {
  formatLocationAddress,
  formatLocationShort,
  formatPhoneDisplay,
  getLocationDineInHours,
  openDirections,
  openPhone,
} from '../../lib/locationUtils'
import { useLocations } from '../../hooks/useLocations'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

const WIDE_BREAKPOINT = 720

export function LocationsSection() {
  const { width } = useWindowDimensions()
  const isWide = width >= WIDE_BREAKPOINT
  const { locations } = useLocations()

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Our Locations</Text>
      <View style={styles.divider} />
      <View style={[styles.grid, isWide && styles.gridWide]}>
        {locations.map((location) => {
          const address = formatLocationAddress(location.address)
          const label = formatLocationShort(location)
          const phone = formatPhoneDisplay(location.phone)

          return (
            <View key={location.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="storefront-outline" size={18} color={colors.gold} />
                <Text style={styles.cardTitle}>{label}</Text>
              </View>
              <Text style={styles.address}>{address}</Text>
              <TouchableOpacity
                onPress={() => openPhone(location.phone)}
                accessibilityRole="link"
                accessibilityLabel={`Call ${label} at ${phone}`}
              >
                <Text style={styles.phone}>{phone}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={() => openDirections(address)}
                accessibilityRole="button"
                accessibilityLabel={`Get directions to ${label}`}
              >
                <Ionicons name="navigate-outline" size={14} color={colors.background} />
                <Text style={styles.directionsBtnText}>Get Directions</Text>
              </TouchableOpacity>
              <Text style={styles.hours}>
                {formatBusinessHours(getLocationDineInHours(location))}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  grid: {
    gap: spacing.md,
  },
  gridWide: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(212,175,55,0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
  },
  address: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  phone: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gold,
  },
  directionsBtnText: {
    fontFamily: fonts.sansBold,
    color: colors.background,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  hours: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
})
