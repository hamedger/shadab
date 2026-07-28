import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator,
} from 'react-native'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'
import { BuffetConfig, BuffetDish } from '../types/buffet'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { colors, spacing, borderRadius } from '../constants/theme'
import { DEFAULT_LOCATION_ID } from '../constants/config'
import { useMenu } from '../hooks/useMenu'

export default function BuffetEditor() {
  const { isAdmin } = useAuthStore()
  const [config, setConfig] = useState<BuffetConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [specialNote, setSpecialNote] = useState('')
  const { data: allMenuItems = [] } = useMenu()

  const buffetMenuItems = allMenuItems.filter((i) => i.isBuffetItem)
  const locationId = DEFAULT_LOCATION_ID

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'buffet', locationId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as BuffetConfig
        setConfig(data)
        setSpecialNote(data.specialNote ?? '')
      }
      setLoading(false)
    })
    return unsub
  }, [])

  if (!isAdmin) return <View style={styles.centered}><Text style={styles.error}>Admin only</Text></View>
  if (loading) return <ActivityIndicator color={colors.gold} style={{ flex: 1, marginTop: 80 }} />

  const ref = doc(db, 'buffet', locationId)

  const toggleLunch = async (val: boolean) => {
    await updateDoc(ref, { isLunchActive: val })
  }
  const toggleDinner = async (val: boolean) => {
    await updateDoc(ref, { isDinnerActive: val })
  }

  const addDish = async (item: { id: string; name: string; isVegetarian: boolean }) => {
    if (!config) return
    if (config.todaysDishes.find((d) => d.menuItemId === item.id)) return
    const newDish: BuffetDish = {
      menuItemId: item.id,
      name: item.name,
      isVegetarian: item.isVegetarian,
      isNew: false,
      sortOrder: config.todaysDishes.length,
    }
    await updateDoc(ref, { todaysDishes: [...config.todaysDishes, newDish] })
  }

  const removeDish = async (menuItemId: string) => {
    if (!config) return
    await updateDoc(ref, { todaysDishes: config.todaysDishes.filter((d) => d.menuItemId !== menuItemId) })
  }

  const saveNote = async () => {
    setSaving(true)
    await updateDoc(ref, { specialNote, updatedAt: serverTimestamp() })
    setSaving(false)
    Alert.alert('Saved', 'Buffet note updated')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Buffet Editor</Text>

      {/* Toggle Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Toggle (Manual Override)</Text>
        <ToggleRow
          label="Lunch Active"
          value={config?.isLunchActive ?? false}
          onChange={toggleLunch}
        />
        <ToggleRow
          label="Dinner Active"
          value={config?.isDinnerActive ?? false}
          onChange={toggleDinner}
        />
      </View>

      {/* Today's Dishes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Dishes ({config?.todaysDishes.length ?? 0})</Text>
        {config?.todaysDishes.map((dish) => (
          <View key={dish.menuItemId} style={styles.dishRow}>
            <View style={[styles.vegDot, { backgroundColor: dish.isVegetarian ? colors.green : '#8b1a1a' }]} />
            <Text style={styles.dishName}>{dish.name}</Text>
            <TouchableOpacity onPress={() => removeDish(dish.menuItemId)} style={styles.removeBtn}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.subTitle}>Add from Buffet Items</Text>
        {buffetMenuItems
          .filter((i) => !config?.todaysDishes.find((d) => d.menuItemId === i.id))
          .map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.addRow}
              onPress={() => addDish({ id: item.id, name: item.name, isVegetarian: item.isVegetarian })}
            >
              <View style={[styles.vegDot, { backgroundColor: item.isVegetarian ? colors.green : '#8b1a1a' }]} />
              <Text style={styles.addName}>{item.name}</Text>
              <Text style={styles.addBtn}>+ Add</Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Special Note */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Note</Text>
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

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.error, fontSize: 16 },
  heading: { color: colors.gold, fontSize: 24, fontWeight: '800', marginBottom: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: spacing.sm },
  subTitle: { color: colors.whiteMuted, fontSize: 13, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { color: colors.white, fontSize: 15 },
  dishRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  vegDot: { width: 10, height: 10, borderRadius: 5 },
  dishName: { flex: 1, color: colors.white, fontSize: 14 },
  removeBtn: { padding: spacing.xs },
  removeText: { color: colors.error, fontWeight: '700', fontSize: 16 },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs + 2, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  addName: { flex: 1, color: colors.whiteMuted, fontSize: 13 },
  addBtn: { color: colors.gold, fontWeight: '700', fontSize: 13 },
})
