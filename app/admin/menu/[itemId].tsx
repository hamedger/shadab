import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useAdminMenu, useInvalidateAdminMenu } from '../../../hooks/useAdminMenu'
import { saveMenuItem, setMenuAvailability } from '../../../lib/admin/menuAdmin'
import { getDishImageUrl } from '../../../lib/menuImages'
import { getMenuItemAvailability } from '../../../lib/menuMerge'
import { DEFAULT_LOCATION_ID } from '../../../constants/config'
import { AdminLocationFilter } from '../../../components/admin/AdminLocationFilter'
import { useAdminLocationStore } from '../../../store/adminLocationStore'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { colors, spacing, borderRadius, fonts } from '../../../constants/theme'

export default function AdminMenuEditScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>()
  const router = useRouter()
  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const setFilterLocationId = useAdminLocationStore((s) => s.setFilterLocationId)
  const stockLocationId = filterLocationId ?? DEFAULT_LOCATION_ID
  const { data: items = [], isLoading } = useAdminMenu(stockLocationId)
  const invalidate = useInvalidateAdminMenu()

  const item = items.find((i) => i.id === itemId)

  const [priceInput, setPriceInput] = useState('')
  const [imageURL, setImageURL] = useState('')
  const [description, setDescription] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!filterLocationId) {
      setFilterLocationId(DEFAULT_LOCATION_ID)
    }
  }, [filterLocationId, setFilterLocationId])

  useEffect(() => {
    if (!item) return
    setPriceInput((item.price / 100).toFixed(2))
    setImageURL(item.imageURL ?? '')
    setDescription(item.description ?? '')
    setIsAvailable(getMenuItemAvailability(item, stockLocationId))
  }, [item, stockLocationId])

  if (isLoading) {
    return <ActivityIndicator color={colors.gold} style={{ flex: 1, marginTop: 80 }} />
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Item not found</Text>
      </View>
    )
  }

  const previewUri =
    imageURL.trim() || getDishImageUrl(item.id, item.name, item.category)

  const handleSave = async () => {
    const price = Math.round(parseFloat(priceInput) * 100)
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Invalid price', 'Enter a valid price in dollars.')
      return
    }

    setSaving(true)
    try {
      const patch = {
        price,
        imageURL: imageURL.trim(),
        description: description.trim(),
      }
      await saveMenuItem(item.id, patch, item)
      await setMenuAvailability(item.id, isAvailable, stockLocationId, { ...item, ...patch })
      invalidate()
      Alert.alert('Saved', 'Menu item updated.', [{ text: 'OK', onPress: () => router.back() }])
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{item.name}</Text>
      <Text style={styles.category}>{item.category.replace(/-/g, ' ')}</Text>

      <AdminLocationFilter showAll={false} />

      <Image source={{ uri: previewUri }} style={styles.image} contentFit="cover" />

      <Input
        label="Price (USD)"
        value={priceInput}
        onChangeText={setPriceInput}
        keyboardType="decimal-pad"
        placeholder="12.99"
      />

      <Input
        label="Photo URL"
        value={imageURL}
        onChangeText={setImageURL}
        placeholder="https://..."
        autoCapitalize="none"
      />

      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>Available at this location</Text>
          <Text style={styles.toggleHint}>Turn off to mark sold out at the selected store</Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
          thumbColor={isAvailable ? colors.gold : colors.whiteMuted}
          trackColor={{ true: colors.goldDark, false: colors.border }}
        />
      </View>

      <Button label="Save Changes" onPress={handleSave} loading={saving} fullWidth size="lg" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 16,
  },
  heading: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  category: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    textTransform: 'capitalize',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toggleLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 15,
  },
  toggleHint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    marginTop: 2,
  },
})
