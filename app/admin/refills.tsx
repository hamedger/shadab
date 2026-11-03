import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { AdminLocationFilter } from '../../components/admin/AdminLocationFilter'
import { StatCard } from '../../components/admin/StatCard'
import { useAdminLocationStore } from '../../store/adminLocationStore'
import { resolveBuffetDocId } from '../../lib/admin/buffetAdmin'
import { BUFFET_REFILLS_COLLECTION } from '../../lib/admin/refillLog'
import {
  REFILL_RANGES,
  REFILL_SLOW_MINUTES,
  RefillGroupStats,
  RefillRange,
  formatRefillDuration,
  formatRefillTime,
  getRefillRangeBounds,
  isSlowRefill,
  refillStatsByDish,
  refillStatsByHour,
  refillStatsByMeal,
  summarizeRefills,
} from '../../lib/admin/refillAnalytics'
import { isBuffetDishNeedsRefill } from '../../lib/services/buffetService'
import { BuffetConfig, BuffetDish, BuffetRefillEvent } from '../../types/buffet'
import { DEFAULT_LOCATION_ID } from '../../constants/config'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

const LOG_LIMIT = 200

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export default function AdminRefillsScreen() {
  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const setFilterLocationId = useAdminLocationStore((s) => s.setFilterLocationId)
  const locationId = filterLocationId ?? DEFAULT_LOCATION_ID

  const [range, setRange] = useState<RefillRange>('today')
  const [events, setEvents] = useState<BuffetRefillEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDishes, setOpenDishes] = useState<BuffetDish[]>([])
  const now = useNow(15_000)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!filterLocationId) setFilterLocationId(DEFAULT_LOCATION_ID)
  }, [filterLocationId, setFilterLocationId])

  // Refill log for the selected range (live).
  useEffect(() => {
    setLoading(true)
    setError(null)
    const { startMs, endMs } = getRefillRangeBounds(range)
    const q = query(
      collection(db, BUFFET_REFILLS_COLLECTION),
      where('requestedAt', '>=', Timestamp.fromMillis(startMs)),
      where('requestedAt', '<', Timestamp.fromMillis(endMs)),
      orderBy('requestedAt', 'desc'),
    )
    return onSnapshot(
      q,
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BuffetRefillEvent))
        setLoading(false)
      },
      (e) => {
        setError(e.message)
        setLoading(false)
      },
    )
  }, [range])

  // Refills waiting right now, straight from the buffet line.
  useEffect(() => {
    let cancelled = false
    let unsub: (() => void) | undefined
    void resolveBuffetDocId(locationId).then((docId) => {
      if (cancelled) return
      unsub = onSnapshot(doc(db, 'buffet', docId), (snap) => {
        const config = snap.exists() ? (snap.data() as BuffetConfig) : null
        setOpenDishes((config?.todaysDishes ?? []).filter(isBuffetDishNeedsRefill))
      })
    })
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [locationId])

  const locationEvents = useMemo(
    () => events.filter((e) => e.locationId === locationId && e.status !== 'cancelled'),
    [events, locationId],
  )
  const summary = useMemo(() => summarizeRefills(locationEvents), [locationEvents])
  const byDish = useMemo(() => refillStatsByDish(locationEvents), [locationEvents])
  const byMeal = useMemo(() => refillStatsByMeal(locationEvents), [locationEvents])
  const byHour = useMemo(() => refillStatsByHour(locationEvents), [locationEvents])
  const multiDay = range === '7d' || range === '30d'

  const waiting = openDishes
    .map((d) => ({
      dish: d,
      seconds: d.refillRequestedAt ? Math.round((now - d.refillRequestedAt) / 1000) : null,
    }))
    .sort((a, b) => (b.seconds ?? -1) - (a.seconds ?? -1))

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Refill Response Times</Text>
      <Text style={styles.subheading}>
        From a dish turning red on the Buffet page (refill requested) to turning green again (restocked).
        Refills over {REFILL_SLOW_MINUTES} min are flagged.
      </Text>

      <AdminLocationFilter showAll={false} />

      <View style={styles.chips}>
        {REFILL_RANGES.map((r) => {
          const active = r.key === range
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setRange(r.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{r.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.stats}>
        <StatCard label="Refills" value={String(summary.count)} hint="completed" />
        <StatCard label="Average" value={formatRefillDuration(summary.avgSeconds)} />
        <StatCard label="Slowest" value={formatRefillDuration(summary.maxSeconds)} />
        <StatCard
          label={`Over ${REFILL_SLOW_MINUTES} min`}
          value={String(summary.slowCount)}
          hint={summary.count ? `${Math.round((summary.slowCount / summary.count) * 100)}% of refills` : undefined}
        />
        <StatCard label="Waiting now" value={String(waiting.length)} />
      </View>

      <Section title="Waiting now">
        {waiting.length === 0 ? (
          <Text style={styles.empty}>No dishes waiting for a refill.</Text>
        ) : (
          <Table
            headers={['Buffet item', 'Requested', 'Waiting']}
            rows={waiting.map(({ dish, seconds }) => ({
              key: dish.menuItemId,
              cells: [
                dish.name,
                formatRefillTime(dish.refillRequestedAt ?? null),
                seconds == null ? '—' : formatRefillDuration(seconds),
              ],
              slow: isSlowRefill(seconds),
            }))}
          />
        )}
      </Section>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <Text style={styles.error}>Could not load refills: {error}</Text>
      ) : (
        <>
          <Section title="By dish" hint="Slowest average first — recurring problem dishes rise to the top.">
            <StatsTable firstHeader="Buffet item" stats={byDish} />
          </Section>

          <Section title="By meal">
            <StatsTable firstHeader="Meal" stats={byMeal} />
          </Section>

          <Section title="By hour" hint="Restaurant time. Look for peak hours with slow refills — a sign of staffing gaps.">
            <StatsTable firstHeader="Hour" stats={byHour} />
          </Section>

          <Section
            title="Refill log"
            hint={locationEvents.length > LOG_LIMIT ? `Showing the latest ${LOG_LIMIT} of ${locationEvents.length}.` : undefined}
          >
            {locationEvents.length === 0 ? (
              <Text style={styles.empty}>No refills in this period.</Text>
            ) : (
              <Table
                headers={['Buffet item', 'Request', 'Completed', 'Time']}
                rows={locationEvents.slice(0, LOG_LIMIT).map((e) => {
                  const requestedMs = e.requestedAt?.toMillis?.() ?? null
                  const open = e.status === 'open'
                  const seconds = open
                    ? requestedMs
                      ? Math.round((now - requestedMs) / 1000)
                      : null
                    : e.durationSeconds
                  return {
                    key: e.id,
                    cells: [
                      e.dishName,
                      formatRefillTime(requestedMs, multiDay),
                      open ? 'Waiting…' : formatRefillTime(e.completedAt?.toMillis?.() ?? null, multiDay),
                      formatRefillDuration(seconds),
                    ],
                    slow: isSlowRefill(seconds),
                  }
                })}
              />
            )}
          </Section>
        </>
      )}
    </ScrollView>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  )
}

function StatsTable({ firstHeader, stats }: { firstHeader: string; stats: RefillGroupStats[] }) {
  if (stats.length === 0) return <Text style={styles.empty}>No completed refills in this period.</Text>
  return (
    <Table
      headers={[firstHeader, 'Refills', 'Average', 'Slowest', `Over ${REFILL_SLOW_MINUTES}m`]}
      rows={stats.map((s) => ({
        key: s.key,
        cells: [
          s.label,
          String(s.count),
          formatRefillDuration(s.avgSeconds),
          formatRefillDuration(s.maxSeconds),
          String(s.slowCount),
        ],
        slow: isSlowRefill(s.avgSeconds),
      }))}
    />
  )
}

interface TableRow {
  key: string
  cells: string[]
  slow?: boolean
}

function Table({ headers, rows }: { headers: string[]; rows: TableRow[] }) {
  return (
    <View>
      <View style={[styles.row, styles.headerRow]}>
        {headers.map((h, i) => (
          <Text key={h} style={[styles.cell, styles.headerCell, i === 0 ? styles.firstCell : styles.numCell]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r) => (
        <View key={r.key} style={[styles.row, r.slow && styles.slowRow]}>
          {r.cells.map((c, i) => (
            <Text
              key={i}
              style={[
                styles.cell,
                i === 0 ? styles.firstCell : styles.numCell,
                r.slow && i === r.cells.length - 1 && styles.slowCell,
              ]}
            >
              {c}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, maxWidth: 960, width: '100%', alignSelf: 'center', gap: spacing.md },
  heading: { fontFamily: fonts.serif, color: colors.gold, fontSize: 28 },
  subheading: { fontFamily: fonts.sans, color: '#000000', fontSize: 14, marginTop: -spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.backgroundCard,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipLabel: { fontFamily: fonts.sansMedium, color: colors.white, fontSize: 13 },
  chipLabelActive: { color: colors.background },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { gap: spacing.xs },
  sectionTitle: { fontFamily: fonts.sansBold, color: '#000000', fontSize: 15 },
  sectionHint: { fontFamily: fonts.sans, color: '#000000', fontSize: 12, opacity: 0.7 },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: { borderBottomColor: colors.borderStrong },
  slowRow: { backgroundColor: 'rgba(239, 83, 80, 0.18)' },
  cell: { fontFamily: fonts.sans, color: colors.white, fontSize: 14 },
  headerCell: { fontFamily: fonts.sansBold, color: colors.goldLight, fontSize: 12 },
  firstCell: { flex: 2 },
  numCell: { flex: 1, textAlign: 'right' },
  slowCell: { color: colors.error, fontFamily: fonts.sansBold },
  empty: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 14, padding: spacing.sm },
  error: { fontFamily: fonts.sans, color: colors.error, fontSize: 14 },
})
