import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useGrowthInsights } from '../../hooks/useGrowthInsights'
import { useAdminOrders } from '../../hooks/useAdminOrders'
import {
  buildRuleBasedBrief,
  computeGrowthMetrics,
} from '../../lib/admin/growthMetrics'
import { askGrowthCopilot, refreshGrowthInsights } from '../../lib/growthCopilot'
import { formatCents } from '../../lib/admin/stats'
import {
  GrowthAction,
  GrowthInsightItem,
  GrowthInsightsDoc,
} from '../../types/insights'
import { colors, spacing, borderRadius, fonts } from '../../constants/theme'

const TONE_COLORS = {
  positive: colors.success,
  warning: colors.goldBright,
  neutral: colors.whiteMuted,
} as const

const PRIORITY_COLORS = {
  high: colors.gold,
  medium: colors.goldLight,
  low: colors.whiteMuted,
} as const

const CATEGORY_ICONS = {
  promo: 'pricetag-outline',
  loyalty: 'ribbon-outline',
  menu: 'restaurant-outline',
  buffet: 'fast-food-outline',
  ops: 'settings-outline',
} as const

function InsightRow({ item }: { item: GrowthInsightItem }) {
  return (
    <View style={styles.insightRow}>
      <View style={[styles.toneDot, { backgroundColor: TONE_COLORS[item.tone] }]} />
      <Text style={styles.insightText}>{item.text}</Text>
    </View>
  )
}

function ActionCard({ action }: { action: GrowthAction }) {
  const icon = CATEGORY_ICONS[action.category]
  return (
    <View style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <Ionicons name={icon} size={16} color={colors.gold} />
        <Text style={styles.actionTitle}>{action.title}</Text>
        <View style={[styles.priorityBadge, { borderColor: PRIORITY_COLORS[action.priority] }]}>
          <Text style={[styles.priorityText, { color: PRIORITY_COLORS[action.priority] }]}>
            {action.priority}
          </Text>
        </View>
      </View>
      <Text style={styles.actionDescription}>{action.description}</Text>
      {action.impactHint ? <Text style={styles.impactHint}>{action.impactHint}</Text> : null}
    </View>
  )
}

function formatGeneratedAt(doc: GrowthInsightsDoc | null): string {
  if (!doc?.generatedAt) return 'Not generated yet'
  const date =
    typeof doc.generatedAt.toDate === 'function'
      ? doc.generatedAt.toDate()
      : new Date()
  return date.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function GrowthCopilotPanel() {
  const { insights, loading: insightsLoading } = useGrowthInsights()
  const { orders, loading: ordersLoading } = useAdminOrders()
  const [refreshing, setRefreshing] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)

  const fallback = useMemo(() => {
    const metrics = computeGrowthMetrics(orders)
    const brief = buildRuleBasedBrief(metrics)
    return { metrics, brief }
  }, [orders])

  const display = insights ?? {
    headline: fallback.brief.headline,
    summary: fallback.brief.summary,
    insights: fallback.brief.insights,
    actions: fallback.brief.actions,
    metrics: fallback.metrics,
    source: 'rules' as const,
    locationId: 'chicago-il',
    generatedAt: null as never,
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshGrowthInsights({ useAI: true })
    } catch {
      // Live fallback already shown from orders
    } finally {
      setRefreshing(false)
    }
  }

  const handleAsk = async () => {
    const trimmed = question.trim()
    if (!trimmed) return
    setAsking(true)
    setAskError(null)
    setAnswer(null)
    try {
      const result = await askGrowthCopilot({ question: trimmed })
      setAnswer(result.data.answer)
      setQuestion('')
    } catch (e) {
      setAskError(e instanceof Error ? e.message : 'Could not get an answer')
    } finally {
      setAsking(false)
    }
  }

  const loading = insightsLoading || ordersLoading
  const metrics = display.metrics ?? fallback.metrics

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={20} color={colors.gold} />
          <Text style={styles.panelTitle}>Growth Copilot</Text>
          {display.source === 'ai' ? (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.gold} />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={14} color={colors.gold} />
              <Text style={styles.refreshText}>Refresh</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginVertical: spacing.md }} />
      ) : (
        <>
          <Text style={styles.headline}>{display.headline}</Text>
          <Text style={styles.summary}>{display.summary}</Text>

          <View style={styles.metricStrip}>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>Today</Text>
              <Text style={styles.metricValue}>{formatCents(metrics.revenueTodayCents)}</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>7-day trend</Text>
              <Text
                style={[
                  styles.metricValue,
                  metrics.revenueWeekChangePct >= 0 ? styles.trendUp : styles.trendDown,
                ]}
              >
                {metrics.revenueWeekChangePct >= 0 ? '+' : ''}
                {metrics.revenueWeekChangePct}%
              </Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricLabel}>AOV</Text>
              <Text style={styles.metricValue}>{formatCents(metrics.avgOrderValueCents)}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Today&apos;s insights</Text>
          <View style={styles.insightsBox}>
            {display.insights.map((item) => (
              <InsightRow key={item.id} item={item} />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Recommended actions</Text>
          <View style={styles.actionsBox}>
            {display.actions.length === 0 ? (
              <Text style={styles.emptyActions}>No actions yet — refresh to generate.</Text>
            ) : (
              display.actions.map((action) => <ActionCard key={action.id} action={action} />)
            )}
          </View>

          <View style={styles.askSection}>
            <Text style={styles.sectionLabel}>Ask your copilot</Text>
            <View style={styles.askRow}>
              <TextInput
                style={styles.askInput}
                placeholder="Why did revenue change this week?"
                placeholderTextColor={colors.whiteMuted}
                value={question}
                onChangeText={setQuestion}
                editable={!asking}
                onSubmitEditing={handleAsk}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.askBtn, asking && styles.askBtnDisabled]}
                onPress={handleAsk}
                disabled={asking || !question.trim()}
              >
                {asking ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Ionicons name="arrow-up" size={16} color={colors.background} />
                )}
              </TouchableOpacity>
            </View>
            {answer ? <Text style={styles.answerText}>{answer}</Text> : null}
            {askError ? <Text style={styles.errorText}>{askError}</Text> : null}
          </View>

          <Text style={styles.footerMeta}>
            {insights
              ? `Updated ${formatGeneratedAt(insights)} · ${insights.source === 'ai' ? 'AI-generated' : 'Rule-based'}`
              : 'Showing live preview from orders — tap Refresh for full AI brief'}
          </Text>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: spacing.sm,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  panelTitle: {
    fontFamily: fonts.serif,
    color: colors.gold,
    fontSize: 22,
  },
  aiBadge: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiBadgeText: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshText: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    fontSize: 12,
  },
  headline: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 17,
    lineHeight: 24,
  },
  summary: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  metricStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metricPill: {
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 100,
  },
  metricLabel: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontFamily: fonts.sansBold,
    color: colors.gold,
    fontSize: 16,
  },
  trendUp: { color: colors.success },
  trendDown: { color: colors.error },
  sectionLabel: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 13,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  insightsBox: {
    gap: spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  toneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  actionsBox: {
    gap: spacing.sm,
  },
  actionCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 4,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionTitle: {
    flex: 1,
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 14,
  },
  priorityBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  actionDescription: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  impactHint: {
    fontFamily: fonts.sansMedium,
    color: colors.goldLight,
    fontSize: 11,
    marginTop: 2,
  },
  emptyActions: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 13,
  },
  askSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  askRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  askInput: {
    flex: 1,
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 14,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  askBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askBtnDisabled: {
    opacity: 0.6,
  },
  answerText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.sans,
    color: colors.error,
    fontSize: 12,
  },
  footerMeta: {
    fontFamily: fonts.sans,
    color: colors.whiteMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
})
