import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Pill,
  Screen,
} from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { colors, radius, shadow, spacing, typography } from '@/theme'
import type { RootStackParamList } from '@/navigation/types'
import type { Notice } from '@sfgc/shared'
import { relativeTime } from '@sfgc/shared'

type Filter = 'all' | 'mine'

type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'gold'

const CATEGORY_TONE: Record<string, PillTone> = {
  exam: 'danger',
  event: 'gold',
  holiday: 'info',
  placement: 'success',
  general: 'neutral',
}

function categoryTone(category: string): PillTone {
  return CATEGORY_TONE[category.trim().toLowerCase()] ?? 'neutral'
}

export default function NoticesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user } = useAuth()

  const [notices, setNotices] = useState<Notice[]>([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const requestId = useRef(0)

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    const id = ++requestId.current
    if (mode === 'refresh') setRefreshing(true)
    else setLoading(true)

    try {
      const { items, meta } = await api.notices.list({ limit: 30 })
      if (!mounted.current || id !== requestId.current) return
      setNotices(items)
      setTotal(meta.total)
      setError(null)
    } catch (err) {
      if (!mounted.current || id !== requestId.current) return
      setError(errorMessage(err))
    } finally {
      if (mounted.current && id === requestId.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    void load('initial')
  }, [load])

  // Returning from PostNotice should show the new notice without a manual pull.
  const firstFocus = useRef(true)
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false
        return
      }
      void load('refresh')
    }, [load]),
  )

  const visible = useMemo(() => {
    if (filter === 'mine') {
      if (!user) return []
      return notices.filter((notice) => notice.author.id === user.id)
    }
    return notices
  }, [notices, filter, user])

  const mineCount = useMemo(
    () => (user ? notices.filter((notice) => notice.author.id === user.id).length : 0),
    [notices, user],
  )

  const openNotice = useCallback(
    (noticeId: string) => navigation.navigate('NoticeDetail', { noticeId }),
    [navigation],
  )

  return (
    <View style={styles.root}>
      <Screen refreshing={refreshing} onRefresh={() => void load('refresh')}>
        <View style={styles.segment}>
          <Pressable
            onPress={() => setFilter('all')}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === 'all' }}
            style={[styles.segmentButton, filter === 'all' && styles.segmentButtonActive]}
          >
            <Text
              style={[styles.segmentLabel, filter === 'all' && styles.segmentLabelActive]}
            >
              All notices
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('mine')}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === 'mine' }}
            style={[styles.segmentButton, filter === 'mine' && styles.segmentButtonActive]}
          >
            <Text
              style={[styles.segmentLabel, filter === 'mine' && styles.segmentLabelActive]}
            >
              Posted by me
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <LoadingState label="Loading notices…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load('initial')} />
        ) : visible.length === 0 ? (
          filter === 'mine' ? (
            <EmptyState
              icon="create-outline"
              title="You haven't posted a notice"
              message="Anything you publish for students or staff shows up here."
              actionLabel="Post a notice"
              onAction={() => navigation.navigate('PostNotice')}
            />
          ) : (
            <EmptyState
              icon="megaphone-outline"
              title="No notices yet"
              message="Notices published by the college will appear here."
              actionLabel="Post a notice"
              onAction={() => navigation.navigate('PostNotice')}
            />
          )
        ) : (
          <>
            <Text style={styles.count}>
              {filter === 'mine'
                ? `${mineCount} notice${mineCount === 1 ? '' : 's'} by you`
                : `Showing ${notices.length} of ${total} notice${total === 1 ? '' : 's'}`}
            </Text>

            {visible.map((notice) => (
              <Card
                key={notice.id}
                onPress={() => openNotice(notice.id)}
                style={styles.noticeCard}
              >
                <View style={styles.pillRow}>
                  <Pill label={notice.category} tone={categoryTone(notice.category)} />
                  {notice.pinned ? <Pill label="Pinned" tone="brand" /> : null}
                </View>

                <Text style={styles.title} numberOfLines={2}>
                  {notice.title}
                </Text>
                <Text style={styles.excerpt} numberOfLines={2}>
                  {notice.body}
                </Text>

                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={13} color={colors.textFaint} />
                  <Text style={styles.meta} numberOfLines={1}>
                    {notice.author.name}
                  </Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.meta}>{relativeTime(notice.publishedAt)}</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </Screen>

      <Pressable
        onPress={() => navigation.navigate('PostNotice')}
        accessibilityRole="button"
        accessibilityLabel="Post a notice"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name="add" size={28} color={colors.textOnBrand} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  segment: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  segmentButtonActive: { backgroundColor: colors.brand },
  segmentLabel: { ...typography.caption, color: colors.textMuted },
  segmentLabelActive: { color: colors.textOnBrand },

  count: { ...typography.caption, color: colors.textFaint, marginTop: -spacing.sm },

  noticeCard: { gap: spacing.sm },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  title: { ...typography.subheading, color: colors.text },
  excerpt: { ...typography.body, color: colors.textMuted, lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  meta: { ...typography.caption, color: colors.textFaint, flexShrink: 1 },
  metaDot: { ...typography.caption, color: colors.textFaint },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
    ...shadow.raised,
  },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
})
