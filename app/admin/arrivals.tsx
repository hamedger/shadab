import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAdminArrivals } from '../../hooks/useAdminArrivals'
import { useAdminLocationStore } from '../../store/adminLocationStore'
import { AdminLocationFilter } from '../../components/admin/AdminLocationFilter'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import {
  checkInReservation,
  formatReservationNumber,
  isPayAtRestaurant,
  getCurrentServiceDate,
  getReservationSortMinutes,
  matchesReservationSearch,
} from '../../lib/admin/reservationAdmin'
import { addDaysToDateString, BUFFET_MEAL_ORDER, BUFFET_MEALS, BuffetMeal } from '../../constants/buffetSchedule'
import { formatMealHours } from '../../lib/services/buffetService'
import { Reservation } from '../../types/reservation'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDateLabel(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function formatCheckInTime(r: Reservation): string {
  return (
    r.checkedInAt?.toDate?.().toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
    }) ?? ''
  )
}

function guestSummary(r: Reservation): string {
  if (r.adults == null) return `Party of ${r.partySize}`
  return [
    `${r.adults} adult${r.adults === 1 ? '' : 's'}`,
    r.children ? `${r.children} child 5–10` : '',
    r.infants ? `${r.infants} under 5` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function ArrivalCard({ reservation }: { reservation: Reservation }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const payAtRestaurant = isPayAtRestaurant(reservation)
  // Confirmed = ready to seat: prepaid via Clover, or booked to pay at the table.
  const paid = reservation.status === 'confirmed'
  const cancelled = reservation.status === 'cancelled'
  const checkedIn = Boolean(reservation.checkedInAt)

  const checkIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await checkInReservation(reservation.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not check in')
    } finally {
      setBusy(false)
    }
  }

  let badge: { label: string; color: string }
  if (cancelled) badge = { label: 'CANCELLED', color: colors.error }
  else if (checkedIn) badge = { label: `CHECKED IN ${formatCheckInTime(reservation)}`, color: colors.greenLight }
  else if (paid && payAtRestaurant) {
    badge = {
      label: `PAY AT TABLE${reservation.estimatedTotalCents != null ? ` ~${formatCents(reservation.estimatedTotalCents)}` : ''}`,
      color: colors.gold,
    }
  } else if (paid) badge = { label: `PAID ${formatCents(reservation.feeCents ?? 0)}`, color: colors.gold }
  else badge = { label: 'NOT PAID', color: colors.error }

  return (
    <View style={[styles.card, (cancelled || checkedIn) && styles.cardDone]}>
      <View style={styles.cardTop}>
        <Text style={styles.time}>{reservation.time}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{reservation.name}</Text>
          <Text style={styles.meta}>
            #{formatReservationNumber(reservation.id)} · {reservation.phone}
          </Text>
        </View>
        <View style={[styles.badge, { borderColor: badge.color }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <Text style={styles.party}>{guestSummary(reservation)}</Text>
      {reservation.occasion ? <Text style={styles.note}>Occasion: {reservation.occasion}</Text> : null}
      {reservation.specialRequests ? <Text style={styles.note}>Requests: {reservation.specialRequests}</Text> : null}

      {paid && !checkedIn ? (
        <Button label="Check in" onPress={checkIn} loading={busy} size="md" style={{ marginTop: spacing.xs }} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

/** Host stand: today's paid reservations by meal, searchable, with one-tap check-in. */
export default function AdminArrivalsScreen() {
  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const [date, setDate] = useState(() => getCurrentServiceDate())
  const [search, setSearch] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const { reservations, loading } = useAdminArrivals(date, filterLocationId)
  const todayService = getCurrentServiceDate()

  const visible = useMemo(() => {
    // Abandoned (unpaid) checkouts are noise at the host stand — only show them when searching.
    const rows = reservations.filter(
      (r) => (search.trim() ? true : r.status !== 'pending') && matchesReservationSearch(r, search),
    )
    return rows.sort((a, b) => getReservationSortMinutes(a) - getReservationSortMinutes(b))
  }, [reservations, search])

  const byMeal = useMemo(() => {
    const groups = new Map<BuffetMeal, Reservation[]>()
    for (const r of visible) {
      const meal = r.meal ?? 'dinner'
      groups.set(meal, [...(groups.get(meal) ?? []), r])
    }
    return groups
  }, [visible])

  const active = reservations.filter((r) => r.status === 'confirmed')
  const arrivedGuests = active.filter((r) => r.checkedInAt).reduce((n, r) => n + r.partySize, 0)
  const expectedGuests = active.reduce((n, r) => n + r.partySize, 0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Arrivals</Text>
        <Text style={styles.count}>
          {arrivedGuests} of {expectedGuests} guests checked in
        </Text>
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity
          onPress={() => setDate(addDaysToDateString(date, -1))}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
          style={styles.dateBtn}
        >
          <Ionicons name="chevron-back" size={20} color={colors.gold} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>
          {formatDateLabel(date)}
          {date === todayService ? ' · Today' : ''}
        </Text>
        <TouchableOpacity
          onPress={() => setDate(addDaysToDateString(date, 1))}
          accessibilityRole="button"
          accessibilityLabel="Next day"
          style={styles.dateBtn}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.gold} />
        </TouchableOpacity>
        {date !== todayService ? (
          <TouchableOpacity onPress={() => setDate(todayService)} accessibilityRole="button">
            <Text style={styles.todayLink}>Back to today</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.searchWrap}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search reservation #, name, or phone"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<Ionicons name="search" size={16} color={colors.whiteMuted} />}
        />
      </View>
      <AdminLocationFilter />

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {visible.length === 0 ? (
            <Text style={styles.empty}>
              {search.trim() ? 'No reservation matches that search for this day.' : 'No reservations for this day.'}
            </Text>
          ) : (
            BUFFET_MEAL_ORDER.filter((meal) => byMeal.has(meal)).map((meal) => (
              <View key={meal} style={styles.mealGroup}>
                <Text style={styles.mealTitle}>
                  {BUFFET_MEALS[meal].label} · {formatMealHours(meal)}
                </Text>
                {byMeal.get(meal)!.map((r) => (
                  <ArrivalCard key={r.id} reservation={r} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  heading: { fontFamily: fonts.serif, color: colors.gold, fontSize: 28 },
  count: { fontFamily: fonts.sansMedium, color: colors.white, fontSize: 14 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  dateBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: { fontFamily: fonts.sansBold, color: colors.white, fontSize: 16 },
  todayLink: { fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 13 },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  empty: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  mealGroup: { gap: spacing.sm },
  mealTitle: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardDone: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  time: { fontFamily: fonts.sansBold, color: colors.white, fontSize: 18, minWidth: 84 },
  name: { fontFamily: fonts.sansBold, color: colors.gold, fontSize: 16 },
  meta: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12 },
  badge: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.5 },
  party: { fontFamily: fonts.sansMedium, color: colors.white, fontSize: 14 },
  note: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 12 },
  error: { fontFamily: fonts.sansMedium, color: colors.error, fontSize: 13 },
})
