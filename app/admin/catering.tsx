import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useAdminCatering } from '../../hooks/useAdminCatering'
import { SimpleFilterBar } from '../../components/admin/SimpleFilterBar'
import { CATERING_STATUS_LABELS, updateCateringStatus } from '../../lib/admin/cateringAdmin'
import { formatOrderTime } from '../../lib/admin/stats'
import { CateringInquiry, CateringStatus } from '../../types/catering'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { Button } from '../../components/ui/Button'

type CateringFilter = CateringStatus | 'pending_active' | 'all'

const FILTER_OPTIONS: { key: CateringFilter; label: string }[] = [
  { key: 'pending_active', label: 'Needs action' },
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'declined', label: 'Declined' },
]

function statusColor(status: CateringStatus): string {
  switch (status) {
    case 'pending':
      return colors.goldLight
    case 'contacted':
      return colors.gold
    case 'confirmed':
      return colors.green
    case 'declined':
      return colors.error
    default:
      return colors.white
  }
}

function matchesFilter(inquiry: CateringInquiry, filter: CateringFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'pending_active') return inquiry.status === 'pending' || inquiry.status === 'contacted'
  return inquiry.status === filter
}

function CateringCard({ inquiry }: { inquiry: CateringInquiry }) {
  const [updating, setUpdating] = useState(false)

  const setStatus = async (status: CateringStatus) => {
    setUpdating(true)
    try {
      await updateCateringStatus(inquiry.id, status)
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Could not update inquiry')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.guestName}>{inquiry.name}</Text>
          <Text style={styles.submitted}>{formatOrderTime(inquiry.createdAt)}</Text>
        </View>
        <View style={[styles.statusPill, { borderColor: statusColor(inquiry.status) }]}>
          <Text style={[styles.statusText, { color: statusColor(inquiry.status) }]}>
            {CATERING_STATUS_LABELS[inquiry.status]}
          </Text>
        </View>
      </View>

      <Text style={styles.detailLine}>
        {inquiry.eventDate}
        {inquiry.eventType ? ` · ${inquiry.eventType}` : ''} · {inquiry.headcount} guests
      </Text>
      {inquiry.location ? <Text style={styles.locationLine}>{inquiry.location}</Text> : null}
      <Text style={styles.contactLine}>
        {inquiry.email} · {inquiry.phone}
      </Text>
      {inquiry.budget ? <Text style={styles.noteLine}>Budget: {inquiry.budget}</Text> : null}
      {inquiry.dietary ? <Text style={styles.noteLine}>Dietary: {inquiry.dietary}</Text> : null}
      {inquiry.details ? <Text style={styles.noteLine}>{inquiry.details}</Text> : null}

      {(inquiry.status === 'pending' || inquiry.status === 'contacted') && (
        <View style={styles.actions}>
          {inquiry.status === 'pending' && (
            <Button
              label="Mark contacted"
              size="sm"
              variant="secondary"
              onPress={() => setStatus('contacted')}
              loading={updating}
            />
          )}
          <Button
            label="Confirm"
            size="sm"
            onPress={() => setStatus('confirmed')}
            disabled={updating}
          />
          <Button
            label="Decline"
            size="sm"
            variant="ghost"
            onPress={() => setStatus('declined')}
            disabled={updating}
          />
        </View>
      )}
    </View>
  )
}

export default function AdminCateringScreen() {
  const { inquiries, loading } = useAdminCatering(100)
  const [filter, setFilter] = useState<CateringFilter>('pending_active')

  const counts = useMemo(() => {
    const map: Partial<Record<CateringFilter, number>> = {}
    for (const opt of FILTER_OPTIONS) {
      map[opt.key] = inquiries.filter((i) => matchesFilter(i, opt.key)).length
    }
    return map
  }, [inquiries])

  const filtered = useMemo(
    () => inquiries.filter((i) => matchesFilter(i, filter)),
    [inquiries, filter],
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Catering</Text>
        <Text style={styles.count}>{filtered.length} shown</Text>
      </View>

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
            <Text style={styles.empty}>No catering inquiries match this filter.</Text>
          ) : (
            filtered.map((inquiry) => <CateringCard key={inquiry.id} inquiry={inquiry} />)
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
