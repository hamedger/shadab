import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../constants/theme'

export function CartBadge({ count }: { count: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count > 9 ? '9+' : count}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  text: { color: colors.background, fontSize: 9, fontWeight: '800' },
})
