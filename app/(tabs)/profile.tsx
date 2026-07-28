import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { signOut } from 'firebase/auth'
import { Ionicons } from '@expo/vector-icons'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useNotificationStore } from '../../store/notificationStore'
import { useLoyalty } from '../../hooks/useLoyalty'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'
import { Button } from '../../components/ui/Button'
import { getProfileDisplayName, getProfileInitial } from '../../lib/profileDisplay'

function Row({
  icon, label, right, onPress,
}: { icon: string; label: string; right?: React.ReactNode; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon as any} size={20} color={colors.gold} style={{ marginRight: spacing.md }} />
      <Text style={styles.rowLabel}>{label}</Text>
      {right ?? <Ionicons name="chevron-forward" size={16} color={colors.whiteMuted} />}
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const { firebaseUser, userProfile, isLoading } = useAuth()
  const { prefs, setPrefs } = useNotificationStore()
  const { points, tier, pointsToNextTier } = useLoyalty()
  const profileEmail = userProfile?.email?.trim() || firebaseUser?.email?.trim() || ''
  const profileName = getProfileDisplayName(userProfile?.displayName, profileEmail)
  const profileInitial = getProfileInitial(userProfile?.displayName, profileEmail)
  const tierLabel = (tier ?? 'bronze').toUpperCase()

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  if (!firebaseUser) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Sign in for full experience</Text>
        <Button label="Sign In" onPress={() => router.push('/(auth)/login' as any)} style={{ marginTop: 16 }} />
        <Button
          label="Guest Checkout"
          onPress={() => router.push('/(auth)/guest' as any)}
          variant="ghost"
          style={{ marginTop: 8 }}
        />
        <Button
          label="Staff Admin"
          onPress={() => router.push('/admin' as never)}
          variant="secondary"
          style={{ marginTop: spacing.lg }}
        />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profileInitial}</Text>
        </View>
        <Text style={styles.name}>{profileName}</Text>
        <Text style={styles.email}>{profileEmail || firebaseUser.email}</Text>
      </View>

      {/* Loyalty card */}
      <TouchableOpacity
        style={styles.loyaltyCard}
        onPress={() => router.push('/loyalty' as any)}
      >
        <View>
          <Text style={styles.loyaltyTier}>{tierLabel} MEMBER</Text>
          <Text style={styles.loyaltyPoints}>{points} pts</Text>
          {pointsToNextTier && (
            <Text style={styles.loyaltyNext}>{pointsToNextTier} pts to next tier</Text>
          )}
        </View>
        <Text style={styles.loyaltyArrow}>›</Text>
      </TouchableOpacity>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <Row
          icon="shield-outline"
          label="Staff Admin"
          onPress={() => router.push('/admin' as never)}
        />
        <Row icon="person-outline" label="Edit Profile" onPress={() => {}} />
        <Row icon="location-outline" label="Saved Addresses" onPress={() => {}} />
        <Row icon="card-outline" label="Payment Methods" onPress={() => {}} />
        <Row icon="gift-outline" label="Gift Cards" onPress={() => {}} />
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <Row
          icon="receipt-outline"
          label="Order Updates"
          right={<Switch value={prefs.orderUpdates} onValueChange={(v) => setPrefs({ orderUpdates: v })} thumbColor={colors.gold} trackColor={{ true: colors.goldDark }} />}
        />
        <Row
          icon="pricetag-outline"
          label="Promotions"
          right={<Switch value={prefs.promotions} onValueChange={(v) => setPrefs({ promotions: v })} thumbColor={colors.gold} trackColor={{ true: colors.goldDark }} />}
        />
        <Row
          icon="grid-outline"
          label="Buffet Alerts"
          right={<Switch value={prefs.buffetAlerts} onValueChange={(v) => setPrefs({ buffetAlerts: v })} thumbColor={colors.gold} trackColor={{ true: colors.goldDark }} />}
        />
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Support</Text>
        <Row icon="help-circle-outline" label="Help & FAQ" onPress={() => {}} />
        <Row icon="chatbubble-outline" label="Contact Us" onPress={() => {}} />
      </View>

      <View style={styles.signOutSection}>
        <Button
          label="Sign Out"
          variant="ghost"
          onPress={async () => { await signOut(auth) }}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyTitle: { fontFamily: fonts.serif, color: colors.white, fontSize: 20 },
  header: { alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarText: { fontFamily: fonts.serif, color: colors.background, fontSize: 28 },
  name: { fontFamily: fonts.serif, color: colors.white, fontSize: 20, marginBottom: 2 },
  email: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 13 },
  loyaltyCard: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loyaltyTier: { fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 11, letterSpacing: 2 },
  loyaltyPoints: { fontFamily: fonts.display, color: colors.white, fontSize: 28, marginTop: 2 },
  loyaltyNext: { fontFamily: fonts.sans, color: colors.whiteMuted, fontSize: 11, marginTop: 2 },
  loyaltyArrow: { fontFamily: fonts.displayLight, color: colors.gold, fontSize: 28 },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  sectionLabel: { fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 11, letterSpacing: 2, paddingTop: spacing.md, paddingBottom: spacing.sm, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, fontFamily: fonts.sans, color: colors.white, fontSize: 14 },
  signOutSection: { alignItems: 'center', paddingVertical: spacing.xl },
})
