import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import type { Notice } from '@sfgc/shared'
import { formatDate, formatDateTime } from '@sfgc/shared'

import {
  AppButton,
  Avatar,
  Card,
  Divider,
  ErrorState,
  LoadingState,
  Pill,
  Screen,
} from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { toneForCategory } from '@/screens/NoticesScreen'
import type { RootStackParamList } from '@/navigation/types'
import { colors, radius, spacing, typography } from '@/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'NoticeDetail'>

export default function NoticeDetailScreen({ route, navigation }: Props) {
  const { noticeId } = route.params

  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** NOT_FOUND is a normal outcome here, not a failure — a push can outlive its notice. */
  const [missing, setMissing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const result = await api.notices.get(noticeId)
        if (cancelled) return
        setNotice(result)
        setError(null)
        setMissing(false)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && (err.code === 'NOT_FOUND' || err.code === 'FORBIDDEN')) {
          setMissing(true)
          setError(null)
        } else {
          setError(errorMessage(err))
        }
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
  }, [noticeId, reloadKey])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
    setLoading(true)
    setReloadKey((key) => key + 1)
  }, [])

  // A notification cold-start lands here directly, so there may be nothing to
  // pop back to — fall back to the Notices tab.
  const backToNotices = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.navigate('MainTabs', { screen: 'Notices' })
  }, [navigation])

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading notice…" />
      </Screen>
    )
  }

  if (missing) {
    return (
      <Screen refreshing={refreshing} onRefresh={handleRefresh}>
        <View style={styles.missing}>
          <ErrorState message="This notice is no longer available. It may have been taken down, expired, or it was not meant for your class." />
          <AppButton
            label="Back to notices"
            icon="arrow-back"
            onPress={backToNotices}
            variant="secondary"
            fullWidth={false}
          />
        </View>
      </Screen>
    )
  }

  if (error || !notice) {
    return (
      <Screen refreshing={refreshing} onRefresh={handleRefresh}>
        <ErrorState
          message={error ?? 'This notice could not be loaded.'}
          onRetry={handleRetry}
        />
      </Screen>
    )
  }

  return (
    <Screen refreshing={refreshing} onRefresh={handleRefresh}>
      <View style={styles.pills}>
        <Pill label={notice.category} tone={toneForCategory(notice.category)} />
        {notice.pinned ? <Pill label="Pinned" tone="gold" /> : null}
      </View>

      <Text style={styles.title}>{notice.title}</Text>

      <View style={styles.byline}>
        <Avatar name={notice.author.name} size={40} />
        <View style={styles.bylineText}>
          <Text style={styles.authorName}>{notice.author.name}</Text>
          <Text style={styles.publishedAt}>
            {formatDateTime(notice.publishedAt)}
          </Text>
        </View>
      </View>

      <Divider />

      <Text style={styles.body}>{notice.body}</Text>

      {notice.expiresAt ? (
        <Card style={styles.expiryCard}>
          <Ionicons name="hourglass-outline" size={18} color={colors.warning} />
          <Text style={styles.expiryText}>
            This notice applies until {formatDate(notice.expiresAt)}, after which it
            leaves the feed.
          </Text>
        </Card>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  missing: { alignItems: 'center', gap: spacing.lg },

  pills: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  title: { ...typography.title, color: colors.text, lineHeight: 30 },

  byline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bylineText: { flex: 1, gap: 2 },
  authorName: { ...typography.bodyStrong, color: colors.text },
  publishedAt: { ...typography.caption, color: colors.textMuted },

  body: { ...typography.body, color: colors.text, lineHeight: 26 },

  expiryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.warningTint,
    borderColor: colors.warning,
    borderRadius: radius.md,
  },
  expiryText: { ...typography.caption, color: colors.textMuted, flex: 1, lineHeight: 19 },
})
