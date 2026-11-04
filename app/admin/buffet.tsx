import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Switch,
} from 'react-native'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { logRefillClosed, logRefillRequested } from '../../lib/admin/refillLog'
import { BuffetConfig, BuffetDish } from '../../types/buffet'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AdminLocationFilter } from '../../components/admin/AdminLocationFilter'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { DEFAULT_LOCATION_ID } from '../../constants/config'
import { formatMealHours, isBuffetDishNeedsRefill } from '../../lib/services/buffetService'
import {
  BUFFET_MEAL_ORDER,
  BUFFET_MEALS,
  BuffetMeal,
  RESTAURANT_TIMEZONE,
  isMealSwitchedOn,
} from '../../constants/buffet'
import { buffetMenuDishes, syncRefillLineWithMenu } from '../../lib/buffetMenuText'
import { resolveBuffetDocId } from '../../lib/admin/buffetAdmin'
import { useAdminLocationStore } from '../../store/adminLocationStore'

type RefillFilter = 'all' | 'red' | 'green'
type PerMeal<T> = Record<BuffetMeal, T>

const perMeal = <T,>(value: T): PerMeal<T> => ({ breakfast: value, lunch: value, dinner: value })

const updatedFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: RESTAURANT_TIMEZONE,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const MENU_PLACEHOLDER: PerMeal<string> = {
  breakfast: 'BREAKFAST:\nHalwa Puri\nChana Masala\nOmelette\n\nDRINKS:\nChai',
  lunch: 'Lunch buffet menu…',
  dinner: 'CHICKEN:\nChicken 65\nAchari Chicken\n\nDESSERTS:\nMango Malai',
}

export default function AdminBuffetScreen() {
  const [config, setConfig] = useState<BuffetConfig | null>(null)
  const [buffetDocId, setBuffetDocId] = useState(DEFAULT_LOCATION_ID)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [specialNote, setSpecialNote] = useState('')
  const [drafts, setDrafts] = useState<PerMeal<string>>(perMeal(''))
  const [dirty, setDirty] = useState<PerMeal<boolean>>(perMeal(false))
  const dirtyRef = useRef<PerMeal<boolean>>(perMeal(false))
  const [uploading, setUploading] = useState<BuffetMeal | null>(null)
  const [servingBusy, setServingBusy] = useState<BuffetMeal | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RefillFilter>('all')
  const [refillBusyId, setRefillBusyId] = useState<string | null>(null)

  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const setFilterLocationId = useAdminLocationStore((s) => s.setFilterLocationId)
  const locationId = filterLocationId ?? DEFAULT_LOCATION_ID

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
    dirtyRef.current = perMeal(false)
    setDirty(perMeal(false))
    void resolveBuffetDocId(locationId).then((docId) => {
      if (cancelled) return
      setBuffetDocId(docId)
      unsub = onSnapshot(doc(db, 'buffet', docId), (snap) => {
        const data = snap.exists() ? (snap.data() as BuffetConfig) : null
        setConfig(data)
        setSpecialNote(data?.specialNote ?? '')
        // Don't overwrite a box the admin is typing in when the doc changes (e.g. a refill tap).
        setDrafts((prev) => {
          const next = { ...prev }
          for (const meal of BUFFET_MEAL_ORDER) {
            if (!dirtyRef.current[meal]) next[meal] = data?.mealMenus?.[meal]?.text ?? ''
          }
          return next
        })
        setLoading(false)
      })
    })

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [locationId])

  const buffetRef = useMemo(() => doc(db, 'buffet', buffetDocId), [buffetDocId])

  const line = config?.todaysDishes ?? []
  const refillCount = line.filter(isBuffetDishNeedsRefill).length
  const counts = { all: line.length, red: refillCount, green: line.length - refillCount }
  const query = search.trim().toLowerCase()
  const rows = line
    .filter((d) => (statusFilter === 'all' ? true : statusFilter === 'red' ? isBuffetDishNeedsRefill(d) : !isBuffetDishNeedsRefill(d)))
    .filter((d) => !query || d.name.toLowerCase().includes(query))
  const groups = [
    ...BUFFET_MEAL_ORDER.map((meal) => ({
      key: meal,
      title: `${BUFFET_MEALS[meal].label} Buffet`,
      dishes: rows.filter((d) => d.meal === meal),
    })),
    { key: 'other', title: 'Other (before per-meal menus)', dishes: rows.filter((d) => !d.meal) },
  ].filter((g) => g.dishes.length > 0)

  const onChangeMenu = (meal: BuffetMeal, text: string) => {
    setDrafts((prev) => ({ ...prev, [meal]: text }))
    const isDirty = text !== (config?.mealMenus?.[meal]?.text ?? '')
    dirtyRef.current = { ...dirtyRef.current, [meal]: isDirty }
    setDirty((prev) => ({ ...prev, [meal]: isDirty }))
  }

  const uploadMenu = async (meal: BuffetMeal) => {
    const text = drafts[meal].trim()
    if (!text) {
      Alert.alert('Menu is empty', `Paste the ${BUFFET_MEALS[meal].label.toLowerCase()} buffet menu first.`)
      return
    }
    setUploading(meal)
    try {
      const snap = await getDoc(buffetRef)
      const current = snap.exists() ? ((snap.data() as BuffetConfig).todaysDishes ?? []) : []
      const { next, removed } = syncRefillLineWithMenu(current, meal, text)
      const batch = writeBatch(db)
      // Dishes dropped from the menu while waiting on a refill close as cancelled (not counted).
      for (const dish of removed) {
        if (isBuffetDishNeedsRefill(dish)) logRefillClosed(batch, dish, 'cancelled')
      }
      batch.set(
        buffetRef,
        {
          locationId,
          mealMenus: {
            [meal]: { text, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.email ?? null },
          },
          todaysDishes: next,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      await batch.commit()
      dirtyRef.current = { ...dirtyRef.current, [meal]: false }
      setDirty((prev) => ({ ...prev, [meal]: false }))
      setDrafts((prev) => ({ ...prev, [meal]: text }))
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not upload the buffet menu')
    } finally {
      setUploading(null)
    }
  }

  /** Serving on/off opens or closes online reservations and the website menu for that meal. */
  const toggleServing = async (meal: BuffetMeal, on: boolean) => {
    setServingBusy(meal)
    try {
      await setDoc(
        buffetRef,
        { locationId, mealServing: { [meal]: on }, updatedAt: serverTimestamp() },
        { merge: true },
      )
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Could not change serving status')
    } finally {
      setServingBusy(null)
    }
  }

  // Red → green closes the refill record; green → red opens one (feeds Admin → Refills).
  const toggleRefill = async (dish: BuffetDish) => {
    setRefillBusyId(dish.menuItemId)
    try {
      const snap = await getDoc(buffetRef)
      const cfg = snap.exists() ? (snap.data() as BuffetConfig) : null
      const existing = cfg?.todaysDishes?.find((d) => d.menuItemId === dish.menuItemId)
      if (!cfg || !existing) return
      const batch = writeBatch(db)
      const patch = isBuffetDishNeedsRefill(existing)
        ? logRefillClosed(batch, existing, 'completed')
        : logRefillRequested(batch, locationId, existing)
      batch.update(buffetRef, {
        todaysDishes: cfg.todaysDishes.map((d) =>
          d.menuItemId === dish.menuItemId ? { ...d, ...patch } : d,
        ),
        updatedAt: serverTimestamp(),
      })
      await batch.commit()
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Could not update refill status')
    } finally {
      setRefillBusyId(null)
    }
  }

  const saveNote = async () => {
    setSaving(true)
    try {
      await setDoc(buffetRef, { locationId, specialNote, updatedAt: serverTimestamp() }, { merge: true })
      Alert.alert('Saved', 'Buffet note updated')
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save buffet note')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={{ flex: 1, marginTop: 80 }} />
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Buffet</Text>

      <AdminLocationFilter showAll={false} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buffet Menus</Text>
        <Text style={styles.pageHint}>
          Paste each menu, one dish per line. Lines ending in &quot;:&quot; or in CAPITALS show as headings.
          Serving on = guests can reserve that buffet online and its menu shows on the website.
        </Text>

        {BUFFET_MEAL_ORDER.map((meal) => {
          const comingSoon = Boolean(BUFFET_MEALS[meal].comingSoon)
          const on = isMealSwitchedOn(config?.mealServing, meal)
          const saved = config?.mealMenus?.[meal]
          const updatedAt = saved?.updatedAt?.toDate?.() ?? null
          const dishCount = buffetMenuDishes(meal, drafts[meal]).length
          return (
            <View key={meal} style={[styles.mealCard, !on && styles.mealCardOff]}>
              <View style={styles.mealHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealTitle}>{BUFFET_MEALS[meal].label} Buffet Menu</Text>
                  <Text style={styles.mealHours}>
                    {comingSoon ? 'Coming soon — hours and price not set yet' : `${formatMealHours(meal)} · every day`}
                  </Text>
                </View>
                <View style={styles.servingCol}>
                  <Text style={[styles.servingLabel, !on && styles.servingLabelOff]}>
                    {comingSoon ? 'Coming soon' : on ? 'Serving · reservations open' : 'Off · reservations closed'}
                  </Text>
                  {servingBusy === meal ? (
                    <ActivityIndicator size="small" color={colors.gold} />
                  ) : (
                    <Switch
                      value={on}
                      disabled={comingSoon}
                      onValueChange={(v) => toggleServing(meal, v)}
                      thumbColor={on ? colors.gold : colors.whiteMuted}
                      trackColor={{ false: colors.border, true: 'rgba(201, 162, 75, 0.45)' }}
                      accessibilityLabel={`${BUFFET_MEALS[meal].label} buffet serving`}
                    />
                  )}
                </View>
              </View>
              <TextInput
                style={styles.menuInput}
                value={drafts[meal]}
                onChangeText={(t) => onChangeMenu(meal, t)}
                placeholder={MENU_PLACEHOLDER[meal]}
                placeholderTextColor={colors.whiteMuted}
                multiline
                textAlignVertical="top"
                accessibilityLabel={`${BUFFET_MEALS[meal].label} buffet menu`}
              />
              <View style={styles.uploadRow}>
                <Button
                  label="Upload to website"
                  onPress={() => uploadMenu(meal)}
                  loading={uploading === meal}
                  disabled={!drafts[meal].trim() || (uploading !== null && uploading !== meal)}
                />
                <Text style={[styles.uploadStatus, dirty[meal] && styles.uploadStatusDirty]}>
                  {dirty[meal]
                    ? `Not uploaded yet · ${dishCount} dish${dishCount === 1 ? '' : 'es'}`
                    : updatedAt
                      ? `Last updated on the site: ${updatedFormatter.format(updatedAt)}${
                          saved?.updatedBy ? ` by ${saved.updatedBy}` : ''
                        }`
                      : 'Not on the website yet'}
                </Text>
              </View>
            </View>
          )
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Refill system ({line.length} dishes)</Text>
          <Text style={styles.pageHint}>
            Built from the uploaded menus. Tap a dot when a dish needs a refill (red), tap again when
            it&apos;s restocked (green).
          </Text>
        </View>

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
              { key: 'all', label: 'All' },
              { key: 'red', label: 'Needs refill', dot: colors.error },
              { key: 'green', label: 'Stocked', dot: colors.green },
            ] as const
          ).map((f) => {
            const active = statusFilter === f.key
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {'dot' in f ? <View style={[styles.filterDot, { backgroundColor: f.dot }]} /> : null}
                <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>
                  {f.label}
                </Text>
                <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
                    {counts[f.key]}
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
          placeholder="Search dishes..."
          placeholderTextColor={colors.whiteMuted}
        />

        {line.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.hint}>Upload a buffet menu above to start refill tracking.</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.hint}>No dishes match this filter.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.key} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{group.title}</Text>
              <View style={styles.card}>
                {group.dishes.map((dish) => {
                  const red = isBuffetDishNeedsRefill(dish)
                  return (
                    <View key={dish.menuItemId} style={[styles.refillRow, red ? styles.refillRowRed : styles.refillRowOk]}>
                      {refillBusyId === dish.menuItemId ? (
                        <ActivityIndicator size="small" color={colors.gold} style={styles.refillDot} />
                      ) : (
                        <TouchableOpacity
                          onPress={() => toggleRefill(dish)}
                          style={[styles.refillDot, { backgroundColor: red ? colors.error : colors.green }]}
                          accessibilityRole="button"
                          accessibilityLabel={
                            red
                              ? `${dish.name}, needs refill. Tap when restocked.`
                              : `${dish.name}, stocked. Tap to request a refill.`
                          }
                        />
                      )}
                      <Text style={[styles.refillName, red && styles.refillNameRed]}>{dish.name}</Text>
                      <Text style={[styles.refillState, red && styles.refillNameRed]}>
                        {red ? 'Needs refill' : 'Stocked'}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          ))
        )}
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

const styles = StyleSheet.create({
  mealCard: {
    backgroundColor: 'rgba(201, 162, 75, 0.06)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  mealCardOff: { opacity: 0.8 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  mealTitle: { fontFamily: fonts.sansBold, color: '#000000', fontSize: 16 },
  mealHours: { fontFamily: fonts.sans, color: '#000000', opacity: 0.7, fontSize: 12, marginTop: 2 },
  servingCol: { alignItems: 'flex-end', gap: 4 },
  servingLabel: { fontFamily: fonts.sansMedium, color: '#2e7d32', fontSize: 12 },
  servingLabelOff: { color: colors.error },
  pageHint: { fontFamily: fonts.sans, color: '#000000', opacity: 0.7, fontSize: 13, marginBottom: spacing.sm },
  menuInput: {
    minHeight: 200,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.white,
  },
  uploadRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  uploadStatus: { fontFamily: fonts.sansMedium, color: '#000000', fontSize: 13, flexShrink: 1 },
  uploadStatusDirty: { color: colors.error },
  refillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  refillRowOk: { backgroundColor: 'rgba(67, 160, 71, 0.06)' },
  refillRowRed: { backgroundColor: 'rgba(239, 83, 80, 0.08)' },
  refillDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  refillName: { flex: 1, fontFamily: fonts.sansMedium, color: colors.white, fontSize: 14 },
  refillNameRed: { color: colors.error },
  refillState: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12 },
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
    color: '#000000',
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
    color: '#000000',
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
