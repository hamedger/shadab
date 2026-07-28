import { Timestamp } from 'firebase/firestore'

export type InsightTone = 'positive' | 'warning' | 'neutral'
export type ActionPriority = 'high' | 'medium' | 'low'
export type ActionCategory = 'promo' | 'loyalty' | 'menu' | 'buffet' | 'ops'

export interface GrowthInsightItem {
  id: string
  text: string
  tone: InsightTone
}

export interface GrowthAction {
  id: string
  title: string
  description: string
  priority: ActionPriority
  category: ActionCategory
  impactHint?: string
}

export interface GrowthMetricsSnapshot {
  revenueTodayCents: number
  revenueWeekCents: number
  revenueWeekChangePct: number
  ordersWeek: number
  ordersWeekChangePct: number
  avgOrderValueCents: number
  deliverySharePct: number
  lapsedCustomers: number
  loyaltyMembers: number
  promoOrdersWeek: number
  topItem: string
  isSaturday: boolean
  isBuffetDay: boolean
}

export interface GrowthInsightsDoc {
  locationId: string
  generatedAt: Timestamp
  headline: string
  summary: string
  insights: GrowthInsightItem[]
  actions: GrowthAction[]
  metrics: GrowthMetricsSnapshot
  source: 'ai' | 'rules'
}
