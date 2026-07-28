import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { BuffetConfig } from '../../types/buffet'
import { MenuItem } from '../../types/menu'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AdminBuffetItemRow } from '../../components/admin/AdminBuffetItemRow'
import { AdminLocationFilter } from '../../components/admin/AdminLocationFilter'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { DEFAULT_LOCATION_ID } from '../../constants/config'
import { useAdminMenu } from '../../hooks/useAdminMenu'
import { isBuffetDishNeedsRefill, isBuffetDishServing } from '../../lib/services/buffetService'
import {
  AdminBuffetStatusFilter,
  buildAdminBuffetSections,
  buffetDishFromMenuItem,
  countAdminBuffetRefillStatus,
} from '../../lib/buffetLayout'
import { ensureBuffetConfig, resolveBuffetDocId } from '../../lib/admin/buffetAdmin'
import { useAdminLocationStore } from '../../store/adminLocationStore'

export default function AdminBuffetScreen() {
  const [config, setConfig] = useState<BuffetConfig | null>(null)
  const [buffetDocId, setBuffetDocId] = useState(DEFAULT_LOCATION_ID)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [specialNote, setSpecialNote] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminBuffetStatusFilter>('all')
  const [servingBusyId, setServingBusyId] = useState<string | null>(null)
  const [refillBusyId, setRefillBusyId] = useState<string | null>(null)

  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const setFilterLocationId = useAdminLocationStore((s) => s.setFilterLocationId)
  const locationId = filterLocationId ?? DEFAULT_LOCATION_ID

  const { data: menuItems = [] } = useAdminMenu(locationId)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!filterLocationId) {
      setFilterLocationId(DEFAULT_LOCATION_ID)
    }
  }, [filterLocationId, setFilterLocationId])

  useEffect(() => {
    let cancelled = false
    let unsub: (() => void) | undefined

    setLoading(true)
    void resolveBuffetDocId(locationId).then((docId) => {
      if (cancelled) return
      setBuffetDocId(docId)
      unsub = onSnapshot(doc(db, 'buffet', docId), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as BuffetConfig
          setConfig(data)
          setSpecialNote(data.specialNote ?? '')
        } else {
          setConfig(null)
          setSpecialNote('')
        }
        setLoading(false)
      })
    })

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [locationId])

  const buffetRef = useMemo(() => doc(db, 'buffet', buffetDocId), [buffetDocId])

  const getConfig = useCallback(async (): Promise<BuffetConfig> => {
    return ensureBuffetConfig(buffetDocId, locationId, menuItems, config)
  }, [buffetDocId, locationId, menuItems, config])

  const { sections, extraRows, statusCounts } = useMemo(() => {
    const filtered = buildAdminBuffetSections(
      menuItems,
      config?.todaysDishes ?? [],
      search,
      statusFilter,
    )
    const all = buildAdminBuffetSections(menuItems, config?.todaysDishes ?? [])
    const allRows = [...all.sections.flatMap((s) => s.rows), ...all.extraRows]
    return {
      ...filtered,
      statusCounts: countAdminBuffetRefillStatus(allRows),
    }
  }, [menuItems, config?.todaysDishes, search, statusFilter])

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={{ flex: 1, marginTop: 80 }} />
  }

  const toggleLunch = async (val: boolean) => {
    try {
      const cfg = await getConfig()
      await updateDoc(buffetRef, { isLunchActive: val, updatedAt: serverTimestamp() })
      if (!config) setConfig(cfg)
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Could not update lunch session')
    }
  }

  const toggleDinner = async (val: boolean) => {
    try {
      const cfg = await getConfig()
      await updateDoc(buffetRef, { isDinnerActive: val, updatedAt: serverTimestamp() })
      if (!config) setConfig(cfg)
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Could not update dinner session')
    }
  }

  const addDish = async (item: MenuItem, needsRefill: boolean, cfg: BuffetConfig) => {
    if (cfg.todaysDishes.find((d) => d.menuItemId === item.id)) return
    const newDish = { ...buffetDishFromMenuItem(item, cfg.todaysDishes.length), needsRefill }
    await updateDoc(buffetRef, {
      todaysDishes: [...cfg.todaysDishes, newDish],
      updatedAt: serverTimestamp(),
    })
  }

  const toggleRefill = async (item: MenuItem) => {
    setRefillBusyId(item.id)
    try {
      const cfg = await getConfig()
      const existing = cfg.todaysDishes.find((d) => d.menuItemId === item.id)
      if (!existing) {
        await addDish(item, false, cfg)
        return
      }

      await updateDoc(buffetRef, {
        todaysDishes: cfg.todaysDishes.map((d) =>
          d.menuItemId === item.id ? { ...d, needsRefill: !isBuffetDishNeedsRefill(d) } : d,
        ),
        updatedAt: serverTimestamp(),
      })
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Could not update refill status')
    } finally {
      setRefillBusyId(null)
    }
  }

  const removeFromBuffet = async (item: MenuItem) => {
    const cfg = await getConfig()
    const existing = cfg.todaysDishes.find((d) => d.menuItemId === item.id)
    if (!existing) return

    Alert.alert(
      'Remove from today\'s line?',
      `${item.name} will disappear from the buffet board until you add it again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setRefillBusyId(item.id)
              try {
                const latest = await getConfig()
                await updateDoc(buffetRef, {
                  todaysDishes: latest.todaysDishes.filter((d) => d.menuItemId !== item.id),
                  updatedAt: serverTimestamp(),
                })
              } catch (e) {
                Alert.alert(
                  'Update failed',
                  e instanceof Error ? e.message : 'Could not remove item from buffet',
                )
              } finally {
                setRefillBusyId(null)
              }
            })()
          },
        },
      ],
    )
  }

  const toggleServing = async (menuItemId: string, next: boolean) => {
    setServingBusyId(menuItemId)
    try {
      const cfg = await getConfig()
      await updateDoc(buffetRef, {
        todaysDishes: cfg.todaysDishes.map((d) =>
          d.menuItemId === menuItemId ? { ...d, isServing: next } : d,
        ),
        updatedAt: serverTimestamp(),
      })
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Could not update serving status')
    } finally {
      setServingBusyId(null)
    }
  }

  const saveNote = async () => {
    setSaving(true)
    try {
      await getConfig()
      await updateDoc(buffetRef, { specialNote, updatedAt: serverTimestamp() })
      Alert.alert('Saved', 'Buffet note updated')
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save buffet note')
    } finally {
      setSaving(false)
    }
  }

  const onBuffetCount = config?.todaysDishes.length ?? 0
  const servingCount =
    config?.todaysDishes.filter((d) => isBuffetDishServing(d)).length ?? 0
  const refillCount =
    config?.todaysDishes.filter((d) => isBuffetDishNeedsRefill(d)).length ?? 0

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Buffet</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sessions</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Lunch active"
            value={config?.isLunchActive ?? false}
            onChange={toggleLunch}
          />
          <ToggleRow
            label="Dinner active"
            value={config?.isDinnerActive ?? false}
            onChange={toggleDinner}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Buffet stations ({servingCount} serving · {onBuffetCount} on line)
          </Text>
          <Text style={styles.legendHint}>
            Green dot = stocked · Red dot = needs refill · Gray dot = not on today&apos;s line · Tap
            dot to add or toggle stocked/refill · Hold dot to remove from line · Serving switch =
            shown on customer buffet page
          </Text>
        </View>

        {!config ? (
          <View style={styles.setupBanner}>
            <Text style={styles.setupBannerText}>
              No buffet line saved for this location yet. Tap any item&apos;s dot to set up
              today&apos;s line — all standard buffet items will be added automatically.
            </Text>
          </View>
        ) : null}

        <AdminLocationFilter showAll={false} />

        {refillCount > 0 ? (
          <TouchableOpacity
            style={styles.refillBanner}
            onPress={() => setStatusFilter('red')}
            accessibilityRole="button"
          >
            <Text style={styles.refillBannerText}>
              {refillCount} item{refillCount === 1 ? '' : 's'} need refill — tap to view
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.filterRow}>
          {(
            [
              { key: 'all', label: 'All on line' },
              { key: 'red', label: 'Needs refill', dot: colors.error },
              { key: 'green', label: 'Stocked', dot: colors.green },
            ] as const
          ).map(({ key, label, dot }) => {
            const active = statusFilter === key
            return (
              <TouchableOpacity
                key={key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {dot ? <View style={[styles.filterDot, { backgroundColor: dot }]} /> : null}
                <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>
                  {label}
                </Text>
                <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
                    {statusCounts[key]}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search buffet items..."
          placeholderTextColor={colors.whiteMuted}
        />

        {sections.length === 0 && extraRows.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.hint}>No items match this filter.</Text>
          </View>
        ) : null}

        {sections.map((section) => (
          <View key={section.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.rows.length === 0 ? (
                <Text style={styles.hint}>No matches in this section.</Text>
              ) : (
                section.rows.map((row) => (
                  <AdminBuffetItemRow
                    key={row.menuItemId}
                    row={row}
                    refillBusy={refillBusyId === row.menuItemId}
                    servingBusy={servingBusyId === row.menuItemId}
                    onToggleRefill={toggleRefill}
                    onRemoveFromBuffet={removeFromBuffet}
                    onToggleServing={toggleServing}
                  />
                ))
              )}
            </View>
          </View>
        ))}

        {extraRows.length > 0 ? (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>More menu items</Text>
            <View style={styles.card}>
              {extraRows.map((row) => (
                <AdminBuffetItemRow
                  key={row.menuItemId}
                  row={row}
                  refillBusy={refillBusyId === row.menuItemId}
                  servingBusy={servingBusyId === row.menuItemId}
                  onToggleRefill={toggleRefill}
                  onRemoveFromBuffet={removeFromBuffet}
                  onToggleServing={toggleServing}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special note</Text>
        <Input
          value={specialNote}
          onChangeText={setSpecialNote}
          placeholder="e.g. Eid Special — Extra dishes today!"
          multiline
        />
        <Button label="Save Note" onPress={saveNote} loading={saving} />
      </View>
    </ScrollView>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? colors.gold : colors.whiteMuted}
        trackColor={{ true: colors.goldDark, false: colors.border }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: spacing.xxl,
  },
  heading: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 28,
    marginBottom: spacing.md,
  },
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
  },
  legendHint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  setupBanner: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  setupBannerText: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  refillBanner: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 83, 80, 0.12)',
  },
  refillBannerText: {
    fontFamily: fonts.sansMedium,
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryTitle: {
    fontFamily: fonts.sansBold,
    color: colors.goldLight,
    fontSize: 13,
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  hint: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    padding: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.backgroundSecondary,
  },
  filterChipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  filterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  filterChipLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 14,
  },
  filterChipLabelActive: {
    color: colors.background,
  },
  filterBadge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: colors.background,
    borderColor: colors.background,
  },
  filterBadgeText: {
    fontFamily: fonts.sansBold,
    color: colors.goldLight,
    fontSize: 11,
  },
  filterBadgeTextActive: {
    color: colors.gold,
  },
  search: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 14,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 15,
  },
})
