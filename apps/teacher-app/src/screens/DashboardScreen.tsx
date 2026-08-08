import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { Notice, Subject } from '@sfgc/shared'
import { formatDate, initials, relativeTime, studentSubtitle } from '@sfgc/shared'

import {
  AppButton,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  Pill,
  Screen,
  SectionTitle,
  StatTile,
} from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { colors, radius, spacing, typography } from '@/theme'
import type { MainTabParamList, RootStackParamList } from '@/navigation/types'

type Props = BottomTabScreenProps<MainTabParamList, 'Dashboard'>

/** Tuple literal — expo-linear-gradient requires at least two stops. */
const HEADER_GRADIENT = [colors.brandDark, colors.brand, colors.brandLight] as const

/** Translucent whites for text sitting on the navy gradient; not theme tokens. */
const ON_GRADIENT_SOFT = 'rgba(255, 255, 255, 0.78)'
const ON_GRADIENT_CHIP = 'rgba(255, 255, 255, 0.16)'

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardScreen({ navigation }: Props) {
  // The tab navigator can switch tabs; the root stack owns the drill-downs.
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user } = useAuth()

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guards every setState in the async loader against a screen that unmounted
  // (or a tab the teacher swiped away from) mid-request.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true)
    else setLoading(true)

    try {
      const [subjectList, noticePage] = await Promise.all([
        api.subjects.list(),
        api.notices.list({ limit: 50 }),
      ])
      if (!mountedRef.current) return
      setSubjects(subjectList)
      setNotices(noticePage.items)
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError(errorMessage(err))
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    void load('initial')
  }, [load])

  const onRefresh = useCallback(() => {
    void load('refresh')
  }, [load])

  const firstName = useMemo(() => {
    const name = user?.name?.trim()
    if (!name) return 'there'
    return name.split(/\s+/)[0] ?? name
  }, [user?.name])

  const greeting = greetingFor(new Date().getHours())
  const today = formatDate(new Date())
  const department = user?.department ?? user?.designation ?? 'SFGC Faculty'

  const totalStudents = useMemo(
    () => subjects.reduce((sum, subject) => sum + (subject.studentCount ?? 0), 0),
    [subjects],
  )

  const myNoticeCount = useMemo(() => {
    if (!user) return 0
    return notices.filter((notice) => notice.author.id === user.id).length
  }, [notices, user])

  // The API sorts pinned notices first; "latest" here means genuinely newest.
  const latestNotices = useMemo(
    () =>
      [...notices]
        .sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        )
        .slice(0, 3),
    [notices],
  )

  const openAttendance = useCallback(
    (subject: Subject) => {
      rootNavigation.navigate('MarkAttendance', {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
      })
    },
    [rootNavigation],
  )

  const hasData = subjects.length > 0 || notices.length > 0

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <LinearGradient
        colors={HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.headerDate}>{today}</Text>
            <Text style={styles.headerGreeting}>
              {greeting}, {firstName}
            </Text>
            <View style={styles.headerChip}>
              <Ionicons name="school-outline" size={13} color={colors.textOnBrand} />
              <Text style={styles.headerChipText} numberOfLines={1}>
                {department}
              </Text>
            </View>
          </View>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {user ? initials(user.name) : '—'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <LoadingState label="Loading your day…" />
      ) : error && !hasData ? (
        <ErrorState message={error} onRetry={() => void load('initial')} />
      ) : (
        <>
          <View style={styles.statRow}>
            <StatTile value={String(subjects.length)} label="Classes" tone="brand" />
            <StatTile value={String(totalStudents)} label="Students" tone="success" />
            <StatTile
              value={String(myNoticeCount)}
              label="Notices posted"
              tone="warning"
            />
          </View>

          <View style={styles.section}>
            <SectionTitle title="Today's classes" />
            {subjects.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No classes assigned"
                message="An administrator assigns your classes. Pull down to refresh once that is done."
              />
            ) : (
              subjects.map((subject) => (
                <Card
                  key={subject.id}
                  onPress={() => openAttendance(subject)}
                  style={styles.classCard}
                >
                  <View style={styles.classTop}>
                    <View style={styles.classHeading}>
                      <Pill label={subject.code} tone="brand" />
                      <Text style={styles.className} numberOfLines={2}>
                        {subject.name}
                      </Text>
                      <Text style={styles.classMeta} numberOfLines={1}>
                        {studentSubtitle(subject)}
                      </Text>
                    </View>
                    <View style={styles.classCount}>
                      <Text style={styles.classCountValue}>
                        {subject.studentCount ?? 0}
                      </Text>
                      <Text style={styles.classCountLabel}>students</Text>
                    </View>
                  </View>

                  <Divider style={styles.classDivider} />

                  <View style={styles.classAction}>
                    <Ionicons
                      name="checkbox-outline"
                      size={16}
                      color={colors.brand}
                    />
                    <Text style={styles.classActionText}>Mark attendance</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textFaint}
                      style={styles.classChevron}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>

          <View style={styles.quickRow}>
            <AppButton
              label="Mark attendance"
              icon="checkbox-outline"
              onPress={() => navigation.navigate('Classes')}
              fullWidth={false}
              style={styles.quickButton}
            />
            <AppButton
              label="Post notice"
              icon="megaphone-outline"
              variant="secondary"
              onPress={() => rootNavigation.navigate('PostNotice')}
              fullWidth={false}
              style={styles.quickButton}
            />
          </View>

          <View style={styles.section}>
            <SectionTitle
              title="Latest notices"
              action={notices.length > 0 ? 'See all' : undefined}
              onAction={
                notices.length > 0 ? () => navigation.navigate('Notices') : undefined
              }
            />
            {latestNotices.length === 0 ? (
              <EmptyState
                icon="megaphone-outline"
                title="No notices yet"
                message="Nothing has been published for your college feed."
                actionLabel="Post a notice"
                onAction={() => rootNavigation.navigate('PostNotice')}
              />
            ) : (
              <Card style={styles.noticeCard}>
                {latestNotices.map((notice, index) => (
                  <View key={notice.id}>
                    {index > 0 ? <Divider /> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open notice ${notice.title}`}
                      onPress={() =>
                        rootNavigation.navigate('NoticeDetail', { noticeId: notice.id })
                      }
                      style={({ pressed }) => [
                        styles.noticeRow,
                        pressed && styles.noticeRowPressed,
                      ]}
                    >
                      <View style={styles.noticeIcon}>
                        <Ionicons
                          name={notice.pinned ? 'pin' : 'document-text-outline'}
                          size={16}
                          color={colors.brand}
                        />
                      </View>
                      <View style={styles.noticeBody}>
                        <Text style={styles.noticeTitle} numberOfLines={1}>
                          {notice.title}
                        </Text>
                        <Text style={styles.noticeMeta} numberOfLines={1}>
                          {notice.category} · {relativeTime(notice.publishedAt)}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textFaint}
                      />
                    </Pressable>
                  </View>
                ))}
              </Card>
            )}
          </View>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headerText: { flex: 1, gap: spacing.xs },
  headerDate: { ...typography.caption, color: ON_GRADIENT_SOFT },
  headerGreeting: { ...typography.title, color: colors.textOnBrand },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: ON_GRADIENT_CHIP,
  },
  headerChipText: { ...typography.tiny, color: colors.textOnBrand },
  headerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ON_GRADIENT_CHIP,
  },
  headerAvatarText: { ...typography.heading, color: colors.textOnBrand },

  statRow: { flexDirection: 'row', gap: spacing.md },

  section: { gap: spacing.md },

  classCard: { gap: spacing.md },
  classTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  classHeading: { flex: 1, gap: spacing.xs },
  className: { ...typography.subheading, color: colors.text },
  classMeta: { ...typography.caption, color: colors.textMuted },
  classCount: { alignItems: 'flex-end' },
  classCountValue: { ...typography.title, color: colors.brand },
  classCountLabel: { ...typography.tiny, color: colors.textFaint },
  classDivider: { marginTop: spacing.xs },
  classAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  classActionText: { ...typography.caption, color: colors.brand },
  classChevron: { marginLeft: 'auto' },

  quickRow: { flexDirection: 'row', gap: spacing.md },
  quickButton: { flex: 1, paddingHorizontal: spacing.md },

  noticeCard: { paddingVertical: spacing.xs },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.md,
  },
  noticeRowPressed: { opacity: 0.6 },
  noticeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandTint,
  },
  noticeBody: { flex: 1, gap: 2 },
  noticeTitle: { ...typography.bodyStrong, color: colors.text },
  noticeMeta: { ...typography.caption, color: colors.textMuted },
})
