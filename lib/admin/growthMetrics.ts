import { subDays, startOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { Timestamp } from 'firebase/firestore'
import { TIMEZONE, DEFAULT_LOCATION_ID } from '../../constants/config'
import { Order } from '../../types/order'
import {
  GrowthAction,
  GrowthInsightItem,
  GrowthMetricsSnapshot,
} from '../../types/insights'

function toDate(value: Timestamp | null | undefined): Date | null {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  return null
}

function startOfTodayTz(): Date {
  const now = toZonedTime(new Date(), TIMEZONE)
  return fromZonedTime(startOfDay(now), TIMEZONE)
}

function isBuffetDay(): boolean {
  const detroit = toZonedTime(new Date(), TIMEZONE)
  return detroit.getDay() === 6
}

export function computeGrowthMetrics(orders: Order[]): GrowthMetricsSnapshot {
  const todayStart = startOfTodayTz()
  const weekStart = subDays(todayStart, 7)
  const priorWeekStart = subDays(weekStart, 7)

  let revenueTodayCents = 0
  let revenueWeekCents = 0
  let revenuePriorWeekCents = 0
  let ordersWeek = 0
  let ordersPriorWeek = 0
  let deliveryWeek = 0
  let promoOrdersWeek = 0

  const itemCounts = new Map<string, { name: string; quantity: number }>()

  for (const order of orders) {
    if (order.status === 'cancelled') continue
    const created = toDate(order.createdAt)
    if (!created) continue

    if (created >= todayStart) revenueTodayCents += order.total

    if (created >= weekStart) {
      revenueWeekCents += order.total
      ordersWeek += 1
      if (order.fulfillmentType === 'delivery') deliveryWeek += 1
      if (order.promoCode) promoOrdersWeek += 1

      for (const item of order.items) {
        const prev = itemCounts.get(item.menuItemId)
        itemCounts.set(item.menuItemId, {
          name: item.name,
          quantity: (prev?.quantity ?? 0) + item.quantity,
        })
      }
    } else if (created >= priorWeekStart) {
      revenuePriorWeekCents += order.total
      ordersPriorWeek += 1
    }
  }

  const pctChange = (current: number, prior: number) =>
    prior > 0 ? Math.round(((current - prior) / prior) * 100) : current > 0 ? 100 : 0

  const topItem =
    [...itemCounts.entries()]
      .sort((a, b) => b[1].quantity - a[1].quantity)[0]?.[1].name ?? '—'

  return {
    revenueTodayCents,
    revenueWeekCents,
    revenueWeekChangePct: pctChange(revenueWeekCents, revenuePriorWeekCents),
    ordersWeek,
    ordersWeekChangePct: pctChange(ordersWeek, ordersPriorWeek),
    avgOrderValueCents: ordersWeek > 0 ? Math.round(revenueWeekCents / ordersWeek) : 0,
    deliverySharePct: ordersWeek > 0 ? Math.round((deliveryWeek / ordersWeek) * 100) : 0,
    lapsedCustomers: 0,
    loyaltyMembers: 0,
    promoOrdersWeek,
    topItem,
    isSaturday: isBuffetDay(),
    isBuffetDay: isBuffetDay(),
  }
}

export interface GrowthBrief {
  headline: string
  summary: string
  insights: GrowthInsightItem[]
  actions: GrowthAction[]
}

export function buildRuleBasedBrief(metrics: GrowthMetricsSnapshot): GrowthBrief {
  const revenueTrend =
    metrics.revenueWeekChangePct > 0
      ? `up ${metrics.revenueWeekChangePct}%`
      : metrics.revenueWeekChangePct < 0
        ? `down ${Math.abs(metrics.revenueWeekChangePct)}%`
        : 'flat'

  const headline = metrics.isBuffetDay
    ? `Saturday buffet day — weekly revenue is ${revenueTrend} vs last week`
    : `Weekly revenue is ${revenueTrend} with ${metrics.ordersWeek} orders`

  const summary =
    metrics.revenueWeekChangePct >= 0
      ? 'Momentum is positive. Focus on retaining repeat guests and lifting average ticket size.'
      : 'Revenue dipped this week. Quick promos and loyalty outreach can recover lost visits.'

  const insights: GrowthInsightItem[] = [
    {
      id: 'revenue-trend',
      text: `7-day revenue is $${(metrics.revenueWeekCents / 100).toFixed(2)} (${revenueTrend} vs prior week).`,
      tone: metrics.revenueWeekChangePct >= 0 ? 'positive' : 'warning',
    },
    {
      id: 'top-seller',
      text:
        metrics.topItem !== '—'
          ? `${metrics.topItem} is your top seller — feature it in push promos and homepage hero.`
          : 'Not enough order data yet to identify a clear bestseller.',
      tone: 'neutral',
    },
  ]

  if (metrics.deliverySharePct >= 55) {
    insights.push({
      id: 'delivery-mix',
      text: `${metrics.deliverySharePct}% of orders are delivery — a pickup incentive could improve margins.`,
      tone: 'warning',
    })
  }

  if (metrics.isBuffetDay) {
    insights.push({
      id: 'buffet-day',
      text: 'Saturday buffet pricing is active ($24.99). Highlight buffet on social before 11 AM.',
      tone: 'positive',
    })
  }

  const actions: GrowthAction[] = []

  if (metrics.lapsedCustomers >= 10) {
    actions.push({
      id: 'win-back',
      title: 'Win back lapsed guests',
      description: `Send a limited-time offer to ${metrics.lapsedCustomers} customers who haven't ordered in 30+ days.`,
      priority: 'high',
      category: 'loyalty',
      impactHint: 'Typical win-back campaigns recover 8–15% of lapsed guests',
    })
  }

  if (metrics.topItem !== '—') {
    actions.push({
      id: 'promote-bestseller',
      title: `Promote ${metrics.topItem}`,
      description: 'Run a weekend combo or loyalty bonus on your top mover to lift average order value.',
      priority: 'medium',
      category: 'menu',
      impactHint: 'Bestseller promos often lift AOV 10–20%',
    })
  }

  if (metrics.deliverySharePct >= 55) {
    actions.push({
      id: 'pickup-promo',
      title: 'Boost pickup orders',
      description: 'Offer 10% off pickup this week to reduce delivery fees and speed up kitchen turns.',
      priority: 'medium',
      category: 'promo',
    })
  }

  if (metrics.promoOrdersWeek < Math.max(3, Math.round(metrics.ordersWeek * 0.1))) {
    actions.push({
      id: 'promo-uptake',
      title: 'Increase promo usage',
      description: 'Only a small share of orders used a promo — test a cart banner with a first-visit code.',
      priority: 'low',
      category: 'promo',
    })
  }

  if (metrics.isBuffetDay) {
    actions.unshift({
      id: 'buffet-push',
      title: 'Push Saturday buffet',
      description: 'Post buffet hours and price on Instagram/Facebook by 10 AM to fill lunch seats early.',
      priority: 'high',
      category: 'buffet',
      impactHint: 'Early buffet posts drive 20–30% of Saturday lunch traffic',
    })
  }

  return { headline, summary, insights, actions: actions.slice(0, 4) }
}

export const GROWTH_INSIGHTS_LOCATION = DEFAULT_LOCATION_ID
