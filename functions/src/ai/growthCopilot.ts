import * as functions from 'firebase-functions/v2'
import * as scheduler from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import OpenAI from 'openai'

if (!admin.apps.length) admin.initializeApp()

const db = admin.firestore()
const LOCATION_ID = 'chicago-il'
const TIMEZONE = 'America/Chicago'
const LAPSE_MS = 30 * 24 * 60 * 60 * 1000

interface MetricsSnapshot {
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

interface GrowthBrief {
  headline: string
  summary: string
  insights: { id: string; text: string; tone: 'positive' | 'warning' | 'neutral' }[]
  actions: {
    id: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    category: 'promo' | 'loyalty' | 'menu' | 'buffet' | 'ops'
    impactHint?: string
  }[]
  source: 'ai' | 'rules'
}

function detroitNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }))
}

function startOfTodayDetroit(): Date {
  const d = detroitNow()
  d.setHours(0, 0, 0, 0)
  return d
}

function pctChange(current: number, prior: number): number {
  if (prior > 0) return Math.round(((current - prior) / prior) * 100)
  return current > 0 ? 100 : 0
}

async function requireAdmin(uid: string): Promise<void> {
  const tokenResult = await admin.auth().getUser(uid)
  const claims = (tokenResult.customClaims ?? {}) as Record<string, unknown>
  if (!claims.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only')
  }
}

async function aggregateMetrics(locationId: string): Promise<MetricsSnapshot> {
  const todayStart = startOfTodayDetroit()
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)
  const priorWeekStart = new Date(weekStart)
  priorWeekStart.setDate(priorWeekStart.getDate() - 7)

  const ordersSnap = await db
    .collection('orders')
    .where('locationId', '==', locationId)
    .where('createdAt', '>=', Timestamp.fromDate(priorWeekStart))
    .orderBy('createdAt', 'desc')
    .limit(500)
    .get()

  let revenueTodayCents = 0
  let revenueWeekCents = 0
  let revenuePriorWeekCents = 0
  let ordersWeek = 0
  let ordersPriorWeek = 0
  let deliveryWeek = 0
  let promoOrdersWeek = 0
  const itemCounts = new Map<string, { name: string; quantity: number }>()

  for (const doc of ordersSnap.docs) {
    const order = doc.data()
    if (order.status === 'cancelled') continue
    const created = order.createdAt?.toDate?.() as Date | undefined
    if (!created) continue

    if (created >= todayStart) revenueTodayCents += order.total ?? 0

    if (created >= weekStart) {
      revenueWeekCents += order.total ?? 0
      ordersWeek += 1
      if (order.fulfillmentType === 'delivery') deliveryWeek += 1
      if (order.promoCode) promoOrdersWeek += 1
      for (const item of order.items ?? []) {
        const prev = itemCounts.get(item.menuItemId)
        itemCounts.set(item.menuItemId, {
          name: item.name,
          quantity: (prev?.quantity ?? 0) + (item.quantity ?? 0),
        })
      }
    } else if (created >= priorWeekStart) {
      revenuePriorWeekCents += order.total ?? 0
      ordersPriorWeek += 1
    }
  }

  const topItem =
    [...itemCounts.entries()].sort((a, b) => b[1].quantity - a[1].quantity)[0]?.[1].name ?? '—'

  const usersSnap = await db.collection('users').limit(500).get()
  const lapseCutoff = Date.now() - LAPSE_MS
  let lapsedCustomers = 0
  let loyaltyMembers = 0

  for (const doc of usersSnap.docs) {
    const user = doc.data()
    if ((user.totalOrderCount ?? 0) > 0) loyaltyMembers += 1
    const updated = user.updatedAt?.toDate?.() as Date | undefined
    if ((user.totalOrderCount ?? 0) > 0 && updated && updated.getTime() < lapseCutoff) {
      lapsedCustomers += 1
    }
  }

  const day = detroitNow().getDay()
  const isSaturday = day === 6

  return {
    revenueTodayCents,
    revenueWeekCents,
    revenueWeekChangePct: pctChange(revenueWeekCents, revenuePriorWeekCents),
    ordersWeek,
    ordersWeekChangePct: pctChange(ordersWeek, ordersPriorWeek),
    avgOrderValueCents: ordersWeek > 0 ? Math.round(revenueWeekCents / ordersWeek) : 0,
    deliverySharePct: ordersWeek > 0 ? Math.round((deliveryWeek / ordersWeek) * 100) : 0,
    lapsedCustomers,
    loyaltyMembers,
    promoOrdersWeek,
    topItem,
    isSaturday,
    isBuffetDay: isSaturday,
  }
}

function buildRuleBasedBrief(metrics: MetricsSnapshot): GrowthBrief {
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

  const insights: GrowthBrief['insights'] = [
    {
      id: 'revenue-trend',
      text: `7-day revenue is $${(metrics.revenueWeekCents / 100).toFixed(2)} (${revenueTrend} vs prior week).`,
      tone: metrics.revenueWeekChangePct >= 0 ? 'positive' : 'warning',
    },
    {
      id: 'loyalty-base',
      text: `${metrics.loyaltyMembers} registered guests have ordered; ${metrics.lapsedCustomers} haven't returned in 30+ days.`,
      tone: metrics.lapsedCustomers > 20 ? 'warning' : 'neutral',
    },
  ]

  if (metrics.topItem !== '—') {
    insights.push({
      id: 'top-seller',
      text: `${metrics.topItem} is the top seller — feature it in promos and the homepage hero.`,
      tone: 'positive',
    })
  }

  if (metrics.deliverySharePct >= 55) {
    insights.push({
      id: 'delivery-mix',
      text: `${metrics.deliverySharePct}% of orders are delivery — pickup incentives protect margins.`,
      tone: 'warning',
    })
  }

  const actions: GrowthBrief['actions'] = []

  if (metrics.isBuffetDay) {
    actions.push({
      id: 'buffet-push',
      title: 'Push Saturday buffet',
      description: 'Post buffet hours and $24.99 pricing on social by 10 AM to fill lunch seats.',
      priority: 'high',
      category: 'buffet',
      impactHint: 'Early posts drive a large share of Saturday lunch traffic',
    })
  }

  if (metrics.lapsedCustomers >= 10) {
    actions.push({
      id: 'win-back',
      title: 'Win back lapsed guests',
      description: `Target ${metrics.lapsedCustomers} customers inactive 30+ days with a limited-time offer.`,
      priority: 'high',
      category: 'loyalty',
      impactHint: 'Win-back offers typically recover 8–15% of lapsed guests',
    })
  }

  if (metrics.topItem !== '—') {
    actions.push({
      id: 'promote-bestseller',
      title: `Promote ${metrics.topItem}`,
      description: 'Bundle your bestseller with a side or drink to lift average order value.',
      priority: 'medium',
      category: 'menu',
    })
  }

  if (metrics.deliverySharePct >= 55) {
    actions.push({
      id: 'pickup-promo',
      title: 'Boost pickup orders',
      description: 'Test 10% off pickup this week to improve kitchen throughput and margins.',
      priority: 'medium',
      category: 'promo',
    })
  }

  return {
    headline,
    summary,
    insights: insights.slice(0, 5),
    actions: actions.slice(0, 4),
    source: 'rules',
  }
}

async function generateBriefWithAI(metrics: MetricsSnapshot): Promise<GrowthBrief> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return buildRuleBasedBrief(metrics)

  const openai = new OpenAI({ apiKey })
  const prompt = `You are a growth advisor for Shadab, an authentic Hyderabadi restaurant in Chicago, IL.

Business metrics (last 7 days vs prior 7 days):
- Revenue this week: $${(metrics.revenueWeekCents / 100).toFixed(2)} (${metrics.revenueWeekChangePct >= 0 ? '+' : ''}${metrics.revenueWeekChangePct}%)
- Orders this week: ${metrics.ordersWeek} (${metrics.ordersWeekChangePct >= 0 ? '+' : ''}${metrics.ordersWeekChangePct}%)
- Avg order value: $${(metrics.avgOrderValueCents / 100).toFixed(2)}
- Delivery share: ${metrics.deliverySharePct}%
- Top seller: ${metrics.topItem}
- Lapsed customers (30+ days): ${metrics.lapsedCustomers}
- Loyalty members who ordered: ${metrics.loyaltyMembers}
- Promo orders this week: ${metrics.promoOrdersWeek}
- Today is Saturday buffet day: ${metrics.isBuffetDay} (Saturday buffet $24.99, weekday $17.99)
- Revenue today so far: $${(metrics.revenueTodayCents / 100).toFixed(2)}

Return ONLY valid JSON with this shape:
{
  "headline": "one compelling sentence for the owner",
  "summary": "2 sentences on business health and focus",
  "insights": [{"id":"string","text":"string","tone":"positive"|"warning"|"neutral"}],
  "actions": [{"id":"string","title":"string","description":"string","priority":"high"|"medium"|"low","category":"promo"|"loyalty"|"menu"|"buffet"|"ops","impactHint":"optional string"}]
}
Provide 3-5 insights and 2-4 concrete growth actions. Be specific to Hyderabadi cuisine and this data.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 900,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content ?? ''
    const parsed = JSON.parse(content) as Omit<GrowthBrief, 'source'>
    return {
      headline: parsed.headline ?? buildRuleBasedBrief(metrics).headline,
      summary: parsed.summary ?? '',
      insights: (parsed.insights ?? []).slice(0, 5),
      actions: (parsed.actions ?? []).slice(0, 4),
      source: 'ai',
    }
  } catch {
    return buildRuleBasedBrief(metrics)
  }
}

async function writeInsights(locationId: string, brief: GrowthBrief, metrics: MetricsSnapshot) {
  await db.collection('admin_insights').doc(locationId).set({
    locationId,
    generatedAt: FieldValue.serverTimestamp(),
    headline: brief.headline,
    summary: brief.summary,
    insights: brief.insights,
    actions: brief.actions,
    metrics,
    source: brief.source,
  })
}

async function runInsightGeneration(locationId: string, useAI: boolean) {
  const metrics = await aggregateMetrics(locationId)
  const brief = useAI ? await generateBriefWithAI(metrics) : buildRuleBasedBrief(metrics)
  await writeInsights(locationId, brief, metrics)
  return { brief, metrics }
}

export const generateDailyGrowthInsights = scheduler.onSchedule(
  { schedule: '0 6 * * *', timeZone: TIMEZONE },
  async () => {
    await runInsightGeneration(LOCATION_ID, true)
  },
)

export const refreshGrowthInsights = functions.https.onCall(async (request) => {
  const { auth, data } = request
  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
  await requireAdmin(auth.uid)

  const locationId = (data?.locationId as string) ?? LOCATION_ID
  const useAI = data?.useAI !== false
  const result = await runInsightGeneration(locationId, useAI)
  return {
    headline: result.brief.headline,
    source: result.brief.source,
    generatedAt: new Date().toISOString(),
  }
})

export const askGrowthCopilot = functions.https.onCall(async (request) => {
  const { auth, data } = request
  if (!auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
  await requireAdmin(auth.uid)

  const question = (data?.question as string)?.trim()
  if (!question) throw new functions.https.HttpsError('invalid-argument', 'Question is required')

  const locationId = (data?.locationId as string) ?? LOCATION_ID
  const metrics = await aggregateMetrics(locationId)
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      answer: `Based on current data: 7-day revenue is $${(metrics.revenueWeekCents / 100).toFixed(2)} (${metrics.revenueWeekChangePct >= 0 ? 'up' : 'down'} ${Math.abs(metrics.revenueWeekChangePct)}% vs last week), with ${metrics.ordersWeek} orders. Top seller: ${metrics.topItem}. ${metrics.lapsedCustomers} guests haven't ordered in 30+ days — a win-back promo could help.`,
      source: 'rules',
    }
  }

  const insightsSnap = await db.collection('admin_insights').doc(locationId).get()
  const stored = insightsSnap.data()

  const openai = new OpenAI({ apiKey })
  const prompt = `You advise the owner of Shadab (Hyderabadi restaurant, Chicago, IL).

Metrics: ${JSON.stringify(metrics)}
Latest brief headline: ${stored?.headline ?? 'n/a'}

Owner question: ${question}

Answer in 2-4 sentences. Be direct, actionable, and grounded in the metrics. No markdown.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.3,
  })

  return {
    answer: completion.choices[0]?.message?.content?.trim() ?? 'Unable to generate an answer right now.',
    source: 'ai',
  }
})
