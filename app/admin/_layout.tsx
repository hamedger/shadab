import React from 'react'
import { Stack } from 'expo-router'
import { AdminGate } from '../../components/admin/AdminGate'
import { AdminShell } from '../../components/admin/AdminShell'

export default function AdminLayout() {
  return (
    <AdminGate>
      <AdminShell>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
      </AdminShell>
    </AdminGate>
  )
}
