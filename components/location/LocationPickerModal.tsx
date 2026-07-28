import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Modal } from '../ui/Modal'
import { Location } from '../../types/location'
import { formatLocationAddress, formatPhoneDisplay } from '../../lib/locationUtils'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

interface LocationPickerModalProps {
  visible: boolean
  locations: Location[]
  selectedLocationId: string | null
  loading?: boolean
  title?: string
  required?: boolean
  onSelect: (locationId: string) => void
  onClose: () => void
}

export function LocationPickerModal({
  visible,
  locations,
  selectedLocationId,
  loading = false,
  title = 'Choose your location',
  required = false,
  onSelect,
  onClose,
}: LocationPickerModalProps) {
  return (
    <Modal
      visible={visible}
      onClose={required ? () => {} : onClose}
      title={title}
    >
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginVertical: spacing.lg }} />
      ) : locations.length === 0 ? (
        <Text style={styles.empty}>No locations are available right now.</Text>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {locations.map((location) => {
            const selected = location.id === selectedLocationId
            return (
              <TouchableOpacity
                key={location.id}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => onSelect(location.id)}
              >
                <View style={styles.optionBody}>
                  <Text style={styles.optionName}>{location.name}</Text>
                  <Text style={styles.optionAddress}>{formatLocationAddress(location.address)}</Text>
                  <Text style={styles.optionPhone}>{formatPhoneDisplay(location.phone)}</Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.gold} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.whiteMuted} />
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}
      {!required && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  list: { maxHeight: 360 },
  empty: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  optionSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  optionBody: { flex: 1, gap: 2 },
  optionName: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
  },
  optionAddress: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  optionPhone: {
    fontFamily: fonts.sans,
    color: colors.goldLight,
    fontSize: 11,
    marginTop: 2,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  cancelText: {
    fontFamily: fonts.sansMedium,
    color: colors.whiteMuted,
    fontSize: 14,
  },
})
