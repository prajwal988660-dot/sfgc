import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import {
  AppButton,
  Avatar,
  Card,
  Divider,
  ErrorState,
  KeyValue,
  LoadingState,
  Pill,
  Screen,
} from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { colors, radius, spacing, typography } from '@/theme'
import type { RootStackParamList } from '@/navigation/types'
import type { Notice, NoticeAudience } from '@sfgc/shared'
import { formatDate, formatDateTime } from '@sfgc/shared'

type Props = NativeStackScreenProps<RootStackParamList, 'NoticeDetail'>

type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'gold'

const CATEGORY_TONE: Record<string, PillTone> = {
  exam: 'danger',
  event: 'gold',
  holiday: 'info',
  placement: 'success',
  general: 'neutral',
}

const AUDIENCE_LABEL: Record<NoticeAudience, string> = {
  ALL: 'Everyone',
  STUDENTS: 'Students only',
  TEACHERS: 'Teaching staff only',
}

function categoryTone(category: string): PillTone {
  return CATEGORY_TONE[category.trim().toLowerCase()] ?? 'neutral'
}

export default function NoticeDetailScreen({ route, navigation }: Props) {
  const { noticeId } = route.params
  const { user } = useAuth()

  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const requestId = useRef(0)

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const id = ++requestId.current
      if (mode === 'refresh') setRefreshing(true)
      else setLoading(true)

      try {
        const result = await api.notices.get(noticeId)
        if (!mounted.current || id !== requestId.current) return
        setNotice(result)
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
    },
    [noticeId],
  )

  useEffect(() => {
    void load('initial')
  }, [load])

  const performDelete = useCallback(async () => {
    setDeleteError(null)
    setDeleting(true)
    try {
      await api.notices.remove(noticeId)
      if (!mounted.current) return
      navigation.goBack()
    } catch (err) {
      if (!mounted.current) return
      setDeleteError(errorMessage(err))
      setDeleting(false)
    }
  }, [noticeId, navigation])

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete this notice?',
      'It will disappear from every student and staff device immediately. This cannot be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void performDelete() },
      ],
    )
  }, [performDelete])

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading the notice…" />
      </Screen>
    )
  }

  if (error || !notice) {
    return (
      <Screen refreshing={refreshing} onRefresh={() => void load('refresh')}>
        <ErrorState
          message={error ?? 'This notice could not be found.'}
          onRetry={() => void load('initial')}
        />
      </Screen>
    )
  }

  const isAuthor = user !== null && user.id === notice.author.id

  return (
    <Screen refreshing={refreshing} onRefresh={() => void load('refresh')}>
      <View style={styles.pillRow}>
        <Pill label={notice.category} tone={categoryTone(notice.category)} />
        {notice.pinned ? <Pill label="Pinned" tone="brand" /> : null}
      </View>

      <Text style={styles.title}>{notice.title}</Text>

      <View style={styles.authorRow}>
        <Avatar name={notice.author.name} size={40} />
        <View style={styles.authorText}>
          <Text style={styles.authorName}>{notice.author.name}</Text>
          <Text style={styles.published}>{formatDateTime(notice.publishedAt)}</Text>
        </View>
      </View>

      <Card>
        <Text style={styles.body}>{notice.body}</Text>
      </Card>

      <Card style={styles.targetCard}>
        <KeyValue label="Audience" value={AUDIENCE_LABEL[notice.audience]} />
        <Divider />
        <KeyValue label="Programme" value={notice.program ?? 'All programmes'} />
        <Divider />
        <KeyValue
          label="Semester"
          value={notice.semester ? `Semester ${notice.semester}` : 'All semesters'}
        />
        <Divider />
        <KeyValue
          label="Expires"
          value={notice.expiresAt ? formatDate(notice.expiresAt) : 'No expiry'}
        />
      </Card>

      {isAuthor ? (
        <>
          {deleteError ? (
            <View style={styles.banner}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.bannerText}>{deleteError}</Text>
            </View>
          ) : null}
          <AppButton
            label="Delete notice"
            variant="danger"
            icon="trash-outline"
            onPress={confirmDelete}
            loading={deleting}
          />
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  title: { ...typography.title, color: colors.text, marginTop: -spacing.sm },

  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  authorText: { flex: 1, gap: 2 },
  authorName: { ...typography.bodyStrong, color: colors.text },
  published: { ...typography.caption, color: colors.textMuted },

  body: { ...typography.body, color: colors.text, lineHeight: 24 },

  targetCard: { gap: spacing.md },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerTint,
  },
  bannerText: { ...typography.caption, color: colors.danger, flex: 1, lineHeight: 19 },
})
