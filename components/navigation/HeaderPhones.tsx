import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  formatLocationShort,
  formatPhoneDisplay,
  normalizeLocationId,
  openPhone,
} from '../../lib/locationUtils'
import { useLocations } from '../../hooks/useLocations'
import { useAuth } from '../../hooks/useAuth'
import { getProfileDisplayName } from '../../lib/profileDisplay'
import { colors, spacing, fonts } from '../../constants/theme'

export function HeaderPhones() {
  const { width } = useWindowDimensions()
  const compact = width < 480
  const { locations } = useLocations()
  const { firebaseUser, userProfile, isLoading } = useAuth()

  const displayLocations = useMemo(() => {
    const byId = new Map<string, (typeof locations)[number]>()
    for (const loc of locations) {
      const id = normalizeLocationId(loc.id)
      const prev = byId.get(id)
      byId.set(id, prev ? { ...prev, ...loc, id } : { ...loc, id })
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [locations])

  const profileEmail = userProfile?.email?.trim() || firebaseUser?.email?.trim() || ''
  const displayName = firebaseUser
    ? getProfileDisplayName(userProfile?.displayName, profileEmail, 'Guest')
    : null

  return (
    <View style={styles.wrap}>
      {displayLocations.map((location) => {
        const label = formatLocationShort(location)
        const phone = formatPhoneDisplay(location.phone)
        return (
          <TouchableOpacity
            key={location.id}
            style={styles.row}
            onPress={() => openPhone(location.phone)}
            accessibilityRole="link"
            accessibilityLabel={`Call ${label} at ${phone}`}
            hitSlop={4}
          >
            <Ionicons name="call-outline" size={compact ? 11 : 12} color={colors.gold} />
            {!compact && <Text style={styles.label}>{label}</Text>}
            <Text style={[styles.phone, compact && styles.phoneCompact]}>{phone}</Text>
          </TouchableOpacity>
        )
      })}
      {firebaseUser && !isLoading && displayName ? (
        <Text
          style={[styles.signedIn, compact && styles.signedInCompact]}
          numberOfLines={1}
          accessibilityRole="text"
        >
          Logged in as{' '}
          <Text style={styles.signedInName}>{displayName}</Text>
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
    gap: 2,
    paddingRight: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 10,
  },
  phone: {
    fontFamily: fonts.sansBold,
    color: colors.goldLight,
    fontSize: 14,
  },
  phoneCompact: {
    fontSize: 13,
  },
  signedIn: {
    marginTop: 2,
    maxWidth: 220,
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 10,
    textAlign: 'right',
  },
  signedInCompact: {
    maxWidth: 160,
    fontSize: 9,
  },
  signedInName: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
  },
})
