import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useAdminReservations } from '../../hooks/useAdminReservations'
import { useAllLocations } from '../../hooks/useLocations'
import { useAdminLocationStore } from '../../store/adminLocationStore'
import { AdminLocationFilter } from '../../components/admin/AdminLocationFilter'
import { SimpleFilterBar } from '../../components/admin/SimpleFilterBar'
import {
  cancelReservationWithPolicy,
  formatReservationNumber,
  previewCancellation,
  RESERVATION_STATUS_LABELS,
  updateReservationStatus,
} from '../../lib/admin/reservationAdmin'
import { BUFFET_MEALS } from '../../constants/buffetSchedule'
import { formatOrderTime } from '../../lib/admin/stats'
import { Reservation, ReservationStatus } from '../../types/reservation'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { Button } from '../../components/ui/Button'

type ReservationFilter = ReservationStatus | 'pending_active' | 'all'

const FILTER_OPTIONS: { key: ReservationFilter; label: string }[] = [
  { key: 'pending_active', label: 'Needs action' },
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'cancelled', label: 'Cancelled' },
]

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function statusColor(status: ReservationStatus): string {
  switch (status) {
    case 'pending':
      return colors.goldLight
    case 'confirmed':
      return colors.green
    case 'cancelled':
      return colors.error
    default:
      return colors.white
  }
}

function matchesFilter(reservation: Reservation, filter: ReservationFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'pending_active') return reservation.status === 'pending'
  return reservation.status === filter
}

function ReservationCard({
  reservation,
  locationName,
}: {
  reservation: Reservation
  locationName?: string
}) {
  const [updating, setUpdating] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const cancelPreview = confirmingCancel ? previewCancellation(reservation) : null

  const setStatus = async (status: ReservationStatus) => {
    setUpdating(true)
    try {
      await updateReservationStatus(reservation.id, status)
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Could not update reservation')
    } finally {
      setUpdating(false)
    }
  }

  const cancel = async () => {
    setUpdating(true)
    try {
      await cancelReservationWithPolicy(reservation.id)
      setConfirmingCancel(false)
    } catch (e) {
      Alert.alert('Cancel failed', e instanceof Error ? e.message : 'Could not cancel reservation')
    } finally {
      setUpdating(false)
    }
  }

  const mealLabel = BUFFET_MEALS[reservation.meal ?? 'dinner'].label
  const guestBreakdown =
    reservation.adults != null
      ? [
          `${reservation.adults} adult${reservation.adults === 1 ? '' : 's'}`,
          reservation.children ? `${reservation.children} child 5–10` : '',
          reservation.infants ? `${reservation.infants} under 5` : '',
        ]
          .filter(Boolean)
          .join(', ')
      : null

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.guestName}>
            {reservation.name} · #{formatReservationNumber(reservation.id)}
          </Text>
          <Text style={styles.submitted}>{formatOrderTime(reservation.createdAt)}</Text>
        </View>
        <View style={[styles.statusPill, { borderColor: statusColor(reservation.status) }]}>
          <Text style={[styles.statusText, { color: statusColor(reservation.status) }]}>
            {RESERVATION_STATUS_LABELS[reservation.status]}
          </Text>
        </View>
      </View>

      <Text style={styles.detailLine}>
        {mealLabel} · {reservation.date} at {reservation.time} · Party of {reservation.partySize}
      </Text>
      {guestBreakdown ? <Text style={styles.noteLine}>{guestBreakdown}</Text> : null}
      {reservation.feeCents != null ? (
        <Text style={styles.noteLine}>
          Prepaid {formatCents(reservation.feeCents)}
          {reservation.status === 'cancelled' && reservation.refundCents != null
            ? ` · Refund ${formatCents(reservation.refundCents)}${
                reservation.cancellationFeeCents
                  ? ` (kept ${formatCents(reservation.cancellationFeeCents)} late-cancel fee)`
                  : ''
              } — issue in Clover`
            : ''}
        </Text>
      ) : null}
      {locationName ? <Text style={styles.locationLine}>{locationName}</Text> : null}
      <Text style={styles.contactLine}>
        {reservation.email} · {reservation.phone}
      </Text>
      {reservation.occasion ? (
        <Text style={styles.noteLine}>Occasion: {reservation.occasion}</Text>
      ) : null}
      {reservation.specialRequests ? (
        <Text style={styles.noteLine}>Requests: {reservation.specialRequests}</Text>
      ) : null}

      {reservation.status === 'pending' && (
        <View style={styles.actions}>
          <Button
            label="Confirm"
            size="sm"
            onPress={() => setStatus('confirmed')}
            loading={updating}
          />
          <Button
            label="Cancel"
            size="sm"
            variant="ghost"
            onPress={cancel}
            disabled={updating}
          />
        </View>
      )}
      {reservation.checkedInAt ? (
        <Text style={styles.noteLine}>
          Checked in{' '}
          {reservation.checkedInAt.toDate().toLocaleTimeString('en-US', {
            timeZone: 'America/Chicago',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      ) : null}
      {reservation.status === 'confirmed' && !reservation.checkedInAt && (
        <View style={styles.actions}>
          {cancelPreview ? (
            <>
              <Text style={styles.noteLine}>
                {cancelPreview.isLateCancellation
                  ? `Within 48 hours: keep ${formatCents(cancelPreview.feeCents)} (20%), refund ${formatCents(cancelPreview.refundCents)}.`
                  : `More than 48 hours out: full refund of ${formatCents(cancelPreview.refundCents)}.`}
              </Text>
              <Button label="Confirm cancel" size="sm" onPress={cancel} loading={updating} />
              <Button
                label="Keep"
                size="sm"
                variant="ghost"
                onPress={() => setConfirmingCancel(false)}
                disabled={updating}
              />
            </>
          ) : (
            <Button
              label="Cancel"
              size="sm"
              variant="ghost"
              onPress={() => setConfirmingCancel(true)}
            />
          )}
        </View>
      )}
    </View>
  )
}

export default function AdminReservationsScreen() {
  const hydrate = useAdminLocationStore((s) => s.hydrate)
  const filterLocationId = useAdminLocationStore((s) => s.filterLocationId)
  const { locations } = useAllLocations()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const { reservations, loading } = useAdminReservations(100, filterLocationId ?? undefined)
  const [filter, setFilter] = useState<ReservationFilter>('pending_active')

  const locationNameById = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations],
  )

  const counts = useMemo(() => {
    const map: Partial<Record<ReservationFilter, number>> = {}
    for (const opt of FILTER_OPTIONS) {
      map[opt.key] = reservations.filter((r) => matchesFilter(r, opt.key)).length
    }
    return map
  }, [reservations])

  const filtered = useMemo(
    () => reservations.filter((r) => matchesFilter(r, filter)),
    [reservations, filter],
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Reservations</Text>
        <Text style={styles.count}>{filtered.length} shown</Text>
      </View>

      <AdminLocationFilter />
      <SimpleFilterBar
        options={FILTER_OPTIONS}
        counts={counts}
        filter={filter}
        onChange={setFilter}
      />

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No reservations match this filter.</Text>
          ) : (
            filtered.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                locationName={locationNameById.get(reservation.locationId)}
              />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  heading: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 28,
  },
  count: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  guestName: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 16,
  },
  submitted: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailLine: {
    fontFamily: fonts.sansMedium,
    color: colors.white,
    fontSize: 14,
  },
  locationLine: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
    fontSize: 12,
  },
  contactLine: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  noteLine: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
})
