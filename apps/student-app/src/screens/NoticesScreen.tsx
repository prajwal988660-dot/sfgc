import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import type { Notice, PaginationMeta } from '@sfgc/shared'
import { relativeTime } from '@sfgc/shared'

import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Pill,
  Screen,
} from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import type { RootStackParamList } from '@/navigation/types'
import { colors, radius, spacing, typography } from '@/theme'

type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'gold'

const FILTERS: ReadonlyArray<{ label: string; value: string | null }> = [
  { label: 'All', value: null },
  { label: 'General', value: 'General' },
  { label: 'Exam', value: 'Exam' },
  { label: 'Event', value: 'Event' },
  { label: 'Holiday', value: 'Holiday' },
  { label: 'Placement', value: 'Placement' },
]

/** Categories are free text on the backend, so unknown ones fall back to neutral. */
const CATEGORY_TONES: Record<string, PillTone> = {
  general: 'neutral',
  exam: 'danger',
  event: 'brand',
  holiday: 'success',
  placement: 'info',
  fee: 'warning',
  fees: 'warning',
  admission: 'info',
  sports: 'success',
  result: 'danger',
  results: 'danger',
}

export function toneForCategory(category: string): PillTone {
  return CATEGORY_TONES[category.trim().toLowerCase()] ?? 'neutral'
}

/** Notice bodies carry line breaks; the list wants one flowing excerpt. */
function excerpt(body: string): string {
  return body.replace(/\s+/g, ' ').trim()
}

export default function NoticesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [category, setCategory] = useState<string | null>(null)
  const [notices, setNotices] = useState<Notice[] | null>(null)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const result = await api.notices.list({
          limit: 30,
          category: category ?? undefined,
        })
        if (cancelled) return
        // The API already sorts pinned first, then newest — keep that order.
        setNotices(result.items)
        setMeta(result.meta)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(errorMessage(err))
        setNotices(null)
        setMeta(null)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [category, reloadKey])

  const selectCategory = useCallback(
    (next: string | null) => {
      if (next === category) return
      setCategory(next)
      setNotices(null)
      setMeta(null)
      setError(null)
      setLoading(true)
    },
    [category],
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
    setLoading(true)
    setReloadKey((key) => key + 1)
  }, [])

  const openNotice = useCallback(
    (notice: Notice) => {
      navigation.navigate('NoticeDetail', { noticeId: notice.id })
    },
    [navigation],
  )

  return (
    <Screen refreshing={refreshing} onRefresh={handleRefresh}>
      <View style={styles.banner}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.brand} />
        <Text style={styles.bannerText}>
          This is the official college channel. Everything posted here comes from the
          office or your teachers — it replaces the college WhatsApp group, so nothing
          gets lost in forwards.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((filter) => {
          const active = filter.value === category
          return (
            <Pressable
              key={filter.label}
              onPress={() => selectCategory(filter.value)}
              accessibilityRole="tab"
              accessibilityLabel={`${filter.label} notices`}
              accessibilityState={{ selected: active }}
              style={styles.filterTouchable}
            >
              <Pill
                label={filter.label}
                tone={active ? 'brand' : 'neutral'}
                style={active ? styles.filterActive : undefined}
              />
            </Pressable>
          )
        })}
      </ScrollView>

      {loading ? (
        <LoadingState label="Loading notices…" />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRetry} />
      ) : !notices || notices.length === 0 ? (
        <EmptyState
          icon="megaphone-outline"
          title={category ? `No ${category.toLowerCase()} notices` : 'No notices yet'}
          message={
            category
              ? 'Nothing in this category right now. Try another filter or pull down to refresh.'
              : 'When the office or your teachers post something, it will appear here and you will get a notification.'
          }
          actionLabel={category ? 'Show all notices' : undefined}
          onAction={category ? () => selectCategory(null) : undefined}
        />
      ) : (
        <View style={styles.list}>
          {meta && meta.total > 0 ? (
            <Text style={styles.count}>
              {meta.total} {meta.total === 1 ? 'notice' : 'notices'}
            </Text>
          ) : null}
          {notices.map((notice) => (
            <NoticeRow
              key={notice.id}
              notice={notice}
              onPress={() => openNotice(notice)}
            />
          ))}
        </View>
      )}
    </Screen>
  )
}

function NoticeRow({ notice, onPress }: { notice: Notice; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={notice.pinned ? styles.pinnedCard : undefined}>
      <View style={styles.rowTop}>
        <Pill label={notice.category} tone={toneForCategory(notice.category)} />
        {notice.pinned ? <Pill label="Pinned" tone="gold" /> : null}
      </View>

      <Text style={styles.rowTitle} numberOfLines={2}>
        {notice.title}
      </Text>
      <Text style={styles.rowExcerpt} numberOfLines={2}>
        {excerpt(notice.body)}
      </Text>

      <View style={styles.rowMeta}>
        <Ionicons name="person-outline" size={13} color={colors.textFaint} />
        <Text style={styles.rowMetaText} numberOfLines={1}>
          {notice.author.name}
        </Text>
        <Text style={styles.rowMetaDot}>·</Text>
        <Text style={styles.rowMetaText}>{relativeTime(notice.publishedAt)}</Text>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brandTint,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerText: { ...typography.caption, color: colors.textMuted, flex: 1, lineHeight: 19 },

  filterRow: { gap: spacing.sm, paddingRight: spacing.lg },
  // Keeps each chip inside a 44pt tall touch target without inflating the pill.
  filterTouchable: { minHeight: 44, justifyContent: 'center' },
  filterActive: { borderWidth: 1, borderColor: colors.brand },

  list: { gap: spacing.md },
  count: { ...typography.caption, color: colors.textFaint },

  pinnedCard: { borderLeftWidth: 4, borderLeftColor: colors.gold },

  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowTitle: { ...typography.subheading, color: colors.text, marginBottom: spacing.xs },
  rowExcerpt: { ...typography.caption, color: colors.textMuted, lineHeight: 20 },

  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  rowMetaText: {
    ...typography.tiny,
    color: colors.textFaint,
    letterSpacing: 0,
    flexShrink: 1,
  },
  rowMetaDot: { ...typography.tiny, color: colors.textFaint },
})
