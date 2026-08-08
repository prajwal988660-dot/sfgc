import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import {
  Avatar,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  Pill,
  Screen,
  SectionTitle,
} from '@/components/ui'
import { colors, radius, shadow, spacing, typography } from '@/theme'
import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/store/auth'
import type { RootStackParamList } from '@/navigation/types'
import type {
  AttendanceTone,
  Event as CollegeEvent,
  Notice,
  StudentAttendance,
  SubjectAttendance,
} from '@sfgc/shared'
import {
  ATTENDANCE_THRESHOLD,
  ATTENDANCE_TONE_COLORS,
  attendanceTone,
  formatFee,
  relativeTime,
  studentSubtitle,
} from '@sfgc/shared'

/** How many of the weakest subjects the dashboard previews. */
const WEAK_SUBJECT_COUNT = 3
const EVENT_PREVIEW_COUNT = 3
const NOTICE_PREVIEW_COUNT = 4

const HERO_GRADIENT = [colors.brandDark, colors.brand, colors.brandLight] as const

/** Where the 75% marker sits on the progress track. */
const THRESHOLD_OFFSET: DimensionValue = `${ATTENDANCE_THRESHOLD}%`

// Text sitting on the maroon gradient — these tints exist only here, so they are
// not theme tokens.
const ON_BRAND_SOFT = 'rgba(255, 255, 255, 0.78)'
const ON_BRAND_FAINT = 'rgba(255, 255, 255, 0.62)'
const ON_BRAND_RING = 'rgba(255, 255, 255, 0.35)'

type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'gold'

const TONE_PILL: Record<AttendanceTone, PillTone> = {
  good: 'success',
  warning: 'warning',
  danger: 'danger',
}

const TONE_LABEL: Record<AttendanceTone, string> = {
  good: 'On track',
  warning: 'At risk',
  danger: 'Critical',
}

const NOTICE_TONES: Record<string, PillTone> = {
  exam: 'danger',
  examination: 'danger',
  urgent: 'danger',
  academic: 'info',
  admission: 'info',
  result: 'brand',
  placement: 'brand',
  sports: 'gold',
  cultural: 'gold',
  holiday: 'success',
  general: 'neutral',
}

function noticeTone(category: string): PillTone {
  return NOTICE_TONES[category.trim().toLowerCase()] ?? 'neutral'
}

function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstNameOf(name: string): string {
  const first = name.trim().split(/\s+/)[0]
  return first && first.length > 0 ? first : name
}

/** Day + month for an event's date chip. */
function dateChip(value: string): { day: string; month: string } {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { day: '—', month: '' }
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
  }
}

/** Percentages arrive as 1-decimal numbers; keep them inside the bar's range. */
function barWidth(percentage: number): DimensionValue {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)))
  return `${clamped}%`
}

/**
 * The API counts PRESENT + LATE as attended when it computes `percentage`, so
 * any fraction shown next to a percentage has to count late the same way —
 * otherwise "24/27" sits beside a percentage derived from 26/27.
 */
function attendedOf(stats: { present: number; late: number }): number {
  return stats.present + stats.late
}

// --------------------------------------------------------------- data state --

interface SectionState<T> {
  data: T | null
  error: string | null
  busy: boolean
}

const INITIAL_SECTION = { data: null, error: null, busy: true }

/**
 * Runs one section's request and folds the outcome into its own state. Errors
 * are captured rather than thrown so a dead endpoint only blanks its own card.
 */
async function loadSection<T>(
  setState: React.Dispatch<React.SetStateAction<SectionState<T>>>,
  request: () => Promise<T>,
  isMounted: () => boolean,
): Promise<void> {
  setState((prev) => ({ ...prev, busy: true }))
  try {
    const data = await request()
    if (!isMounted()) return
    setState({ data, error: null, busy: false })
  } catch (error) {
    if (!isMounted()) return
    setState((prev) => ({ ...prev, error: errorMessage(error), busy: false }))
  }
}

// ------------------------------------------------------------------ screen --

export default function DashboardScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const mountedRef = useRef(true)
  const isMounted = useCallback(() => mountedRef.current, [])

  const [attendance, setAttendance] =
    useState<SectionState<StudentAttendance>>(INITIAL_SECTION)
  const [events, setEvents] = useState<SectionState<CollegeEvent[]>>(INITIAL_SECTION)
  const [notices, setNotices] = useState<SectionState<Notice[]>>(INITIAL_SECTION)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAttendance = useCallback(
    () => loadSection(setAttendance, () => api.attendance.mine(), isMounted),
    [isMounted],
  )

  const fetchEvents = useCallback(
    () =>
      loadSection(
        setEvents,
        () =>
          api.events
            .list({ upcoming: true, limit: EVENT_PREVIEW_COUNT })
            .then((page) => page.items),
        isMounted,
      ),
    [isMounted],
  )

  const fetchNotices = useCallback(
    () =>
      loadSection(
        setNotices,
        () => api.notices.list({ limit: NOTICE_PREVIEW_COUNT }).then((page) => page.items),
        isMounted,
      ),
    [isMounted],
  )

  // allSettled, never all: the dashboard must render whatever came back, even if
  // one endpoint is down.
  const loadAll = useCallback(
    () => Promise.allSettled([fetchAttendance(), fetchEvents(), fetchNotices()]),
    [fetchAttendance, fetchEvents, fetchNotices],
  )

  useEffect(() => {
    mountedRef.current = true
    void loadAll()
    return () => {
      mountedRef.current = false
    }
  }, [loadAll])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    void loadAll().finally(() => {
      if (mountedRef.current) setRefreshing(false)
    })
  }, [loadAll])

  // ------------------------------------------------------------ navigation --

  const openProfile = useCallback(() => navigation.navigate('Profile'), [navigation])

  // Navigating to the parent stack route with a nested `screen` is the one
  // type-safe way to jump tabs from a tab screen.
  const openAttendanceTab = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'Attendance' }),
    [navigation],
  )
  const openEventsTab = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'Events' }),
    [navigation],
  )
  const openNoticesTab = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'Notices' }),
    [navigation],
  )

  const openEvent = useCallback(
    (event: CollegeEvent) =>
      navigation.navigate('EventDetail', { eventId: event.id, title: event.title }),
    [navigation],
  )
  const openNotice = useCallback(
    (notice: Notice) => navigation.navigate('NoticeDetail', { noticeId: notice.id }),
    [navigation],
  )

  const retryAttendance = useCallback(() => void fetchAttendance(), [fetchAttendance])
  const retryEvents = useCallback(() => void fetchEvents(), [fetchEvents])
  const retryNotices = useCallback(() => void fetchNotices(), [fetchNotices])

  // ---------------------------------------------------------------- render --

  const name = user?.name ?? 'Student'
  const subtitle = studentSubtitle(user ?? {})

  const renderAttendance = () => {
    const { data, error, busy } = attendance

    if (!data && busy) {
      return (
        <Card>
          <LoadingState label="Checking your attendance…" />
        </Card>
      )
    }
    if (!data && error) {
      return (
        <Card>
          <ErrorState message={error} onRetry={retryAttendance} />
        </Card>
      )
    }
    if (!data) return null

    const { overall } = data
    if (overall.total === 0) {
      return (
        <Card>
          <EmptyState
            icon="calendar-outline"
            title="No attendance yet"
            message="Your percentage appears here once your teachers start marking classes."
          />
        </Card>
      )
    }

    const tone = attendanceTone(overall.percentage)
    const toneColor = ATTENDANCE_TONE_COLORS[tone]
    const eligible = overall.percentage >= ATTENDANCE_THRESHOLD

    return (
      <Card onPress={openAttendanceTab} style={styles.attendanceCard}>
        <View style={styles.attendanceHead}>
          <View style={styles.attendanceHeadText}>
            <Text style={styles.attendanceLabel}>Overall attendance</Text>
            <Text style={[styles.attendanceValue, { color: toneColor }]}>
              {overall.percentage}%
            </Text>
          </View>
          <Pill label={TONE_LABEL[tone]} tone={TONE_PILL[tone]} />
        </View>

        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityLabel={`Overall attendance ${overall.percentage} percent`}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(overall.percentage) }}
        >
          <View
            style={[
              styles.trackFill,
              { width: barWidth(overall.percentage), backgroundColor: toneColor },
            ]}
          />
          {/* The 75% line the university actually grades against. */}
          <View style={styles.trackThreshold} />
        </View>

        <View style={styles.attendanceMeta}>
          <Text style={styles.attendanceMetaText}>
            {attendedOf(overall)}/{overall.total} classes
          </Text>
          <Text style={styles.attendanceMetaText}>
            Required {ATTENDANCE_THRESHOLD}%
          </Text>
        </View>

        <View style={styles.verdictRow}>
          <Ionicons
            name={eligible ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={toneColor}
          />
          <Text style={[styles.verdictText, { color: toneColor }]}>
            {eligible
              ? 'You are eligible to sit for exams'
              : `Below the ${ATTENDANCE_THRESHOLD}% requirement — speak to your mentor`}
          </Text>
        </View>
      </Card>
    )
  }

  const renderSubjects = () => {
    const data = attendance.data
    // The attendance card above already owns this endpoint's loading and error
    // states; showing them twice would just be noise.
    if (!data) return null

    const weakest = [...data.bySubject]
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, WEAK_SUBJECT_COUNT)

    return (
      <View style={styles.section}>
        <SectionTitle
          title="Subject-wise attendance"
          action="See all"
          onAction={openAttendanceTab}
        />
        <Card>
          {weakest.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="No subjects yet"
              message="Once you are enrolled in subjects they will be listed here."
            />
          ) : (
            weakest.map((subject, index) => (
              <View key={subject.subjectId}>
                {index > 0 ? <Divider style={styles.rowDivider} /> : null}
                <SubjectRow subject={subject} />
              </View>
            ))
          )}
        </Card>
      </View>
    )
  }

  const renderEvents = () => {
    const { data, error, busy } = events

    let body: React.ReactNode
    if (!data && busy) {
      body = (
        <Card>
          <LoadingState label="Loading events…" />
        </Card>
      )
    } else if (!data && error) {
      body = (
        <Card>
          <ErrorState message={error} onRetry={retryEvents} />
        </Card>
      )
    } else if (data && data.length > 0) {
      body = (
        <View style={styles.stack}>
          {data.map((event) => (
            <EventRow key={event.id} event={event} onPress={() => openEvent(event)} />
          ))}
        </View>
      )
    } else {
      body = (
        <Card>
          <EmptyState
            icon="sparkles-outline"
            title="Nothing coming up"
            message="New fests, workshops and seminars will show up here."
          />
        </Card>
      )
    }

    return (
      <View style={styles.section}>
        <SectionTitle title="Upcoming events" action="See all" onAction={openEventsTab} />
        {body}
      </View>
    )
  }

  const renderNotices = () => {
    const { data, error, busy } = notices

    let body: React.ReactNode
    if (!data && busy) {
      body = (
        <Card>
          <LoadingState label="Loading notices…" />
        </Card>
      )
    } else if (!data && error) {
      body = (
        <Card>
          <ErrorState message={error} onRetry={retryNotices} />
        </Card>
      )
    } else if (data && data.length > 0) {
      body = (
        <Card>
          {data.map((notice, index) => (
            <View key={notice.id}>
              {index > 0 ? <Divider style={styles.rowDivider} /> : null}
              <NoticeRow notice={notice} onPress={() => openNotice(notice)} />
            </View>
          ))}
        </Card>
      )
    } else {
      body = (
        <Card>
          <EmptyState
            icon="megaphone-outline"
            title="No notices"
            message="Announcements from the college will appear here."
          />
        </Card>
      )
    }

    return (
      <View style={styles.section}>
        <SectionTitle title="Latest notices" action="See all" onAction={openNoticesTab} />
        {body}
      </View>
    )
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Pressable
        onPress={openProfile}
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        style={({ pressed }) => [styles.heroPress, pressed && styles.heroPressed]}
      >
        <LinearGradient
          colors={HERO_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroText}>
            <Text style={styles.heroGreeting}>{greetingFor(new Date())}</Text>
            <Text style={styles.heroName} numberOfLines={1}>
              {firstNameOf(name)}
            </Text>
            {subtitle ? (
              <Text style={styles.heroSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {user?.registerNo ? (
              <Text style={styles.heroRegister}>{user.registerNo}</Text>
            ) : null}
          </View>

          <View style={styles.heroSide}>
            <View style={styles.avatarRing}>
              <Avatar name={name} size={48} />
            </View>
            <Ionicons name="chevron-forward" size={18} color={ON_BRAND_SOFT} />
          </View>
        </LinearGradient>
      </Pressable>

      {renderAttendance()}
      {renderSubjects()}
      {renderEvents()}
      {renderNotices()}
    </Screen>
  )
}

// ------------------------------------------------------------------- rows --

function SubjectRow({ subject }: { subject: SubjectAttendance }) {
  const toneColor = ATTENDANCE_TONE_COLORS[attendanceTone(subject.percentage)]

  return (
    <View style={styles.subjectRow}>
      <View style={styles.subjectCodeBox}>
        <Text style={styles.subjectCode} numberOfLines={1}>
          {subject.code}
        </Text>
      </View>
      <View style={styles.subjectMain}>
        <Text style={styles.subjectName} numberOfLines={1}>
          {subject.name}
        </Text>
        <Text style={styles.subjectCount}>
          {attendedOf(subject)}/{subject.total}
        </Text>
      </View>
      <Text style={[styles.subjectPercent, { color: toneColor }]}>
        {subject.percentage}%
      </Text>
    </View>
  )
}

function EventRow({ event, onPress }: { event: CollegeEvent; onPress: () => void }) {
  const chip = dateChip(event.startsAt)

  return (
    <Card onPress={onPress} style={styles.eventCard}>
      <View style={styles.eventChip}>
        <Text style={styles.eventChipDay}>{chip.day}</Text>
        <Text style={styles.eventChipMonth}>{chip.month}</Text>
      </View>
      <View style={styles.eventMain}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.eventMetaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textFaint} />
          <Text style={styles.eventMeta} numberOfLines={1}>
            {event.venue ?? 'Venue to be announced'}
          </Text>
        </View>
        <Text style={styles.eventWhen}>{relativeTime(event.startsAt)}</Text>
      </View>
      <Pill label={formatFee(event.fee)} tone={event.fee ? 'brand' : 'success'} />
    </Card>
  )
}

function NoticeRow({ notice, onPress }: { notice: Notice; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open notice: ${notice.title}`}
      style={({ pressed }) => [styles.noticeRow, pressed && styles.noticeRowPressed]}
    >
      <View style={styles.noticeTop}>
        <Pill label={notice.category} tone={noticeTone(notice.category)} />
        {notice.pinned ? <Ionicons name="pin" size={13} color={colors.gold} /> : null}
        <Text style={styles.noticeTime}>{relativeTime(notice.publishedAt)}</Text>
      </View>
      <Text style={styles.noticeTitle} numberOfLines={2}>
        {notice.title}
      </Text>
    </Pressable>
  )
}

// ----------------------------------------------------------------- styles --

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  stack: { gap: spacing.md },
  rowDivider: { marginVertical: spacing.md },

  heroPress: { borderRadius: radius.xl },
  heroPressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.card,
  },
  heroText: { flex: 1, gap: 2 },
  heroGreeting: { ...typography.caption, color: ON_BRAND_SOFT },
  heroName: { ...typography.display, color: colors.textOnBrand },
  heroSubtitle: { ...typography.caption, color: ON_BRAND_SOFT, marginTop: spacing.xs },
  heroRegister: { ...typography.tiny, color: ON_BRAND_FAINT },
  heroSide: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarRing: {
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: ON_BRAND_RING,
  },

  attendanceCard: { gap: spacing.md },
  attendanceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  attendanceHeadText: { gap: 2 },
  attendanceLabel: { ...typography.caption, color: colors.textMuted },
  attendanceValue: { fontSize: 42, fontWeight: '700', letterSpacing: -1 },

  track: {
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  trackFill: { height: '100%', borderRadius: radius.pill },
  trackThreshold: {
    position: 'absolute',
    left: THRESHOLD_OFFSET,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.borderStrong,
  },

  attendanceMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  attendanceMetaText: { ...typography.caption, color: colors.textFaint },

  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  verdictText: { ...typography.caption, flex: 1 },

  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  subjectCodeBox: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.brandTint,
    minWidth: 62,
    alignItems: 'center',
  },
  subjectCode: { ...typography.tiny, color: colors.brand },
  subjectMain: { flex: 1, gap: 2 },
  subjectName: { ...typography.bodyStrong, color: colors.text },
  subjectCount: { ...typography.caption, color: colors.textFaint },
  subjectPercent: { ...typography.heading },

  eventCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eventChip: {
    width: 52,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
  },
  eventChipDay: { ...typography.title, color: colors.brand },
  eventChipMonth: { ...typography.tiny, color: colors.brandLight },
  eventMain: { flex: 1, gap: 2 },
  eventTitle: { ...typography.bodyStrong, color: colors.text },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  eventMeta: { ...typography.caption, color: colors.textMuted, flex: 1 },
  eventWhen: { ...typography.tiny, color: colors.textFaint },

  noticeRow: { gap: spacing.xs, paddingVertical: spacing.xs, minHeight: 44 },
  noticeRowPressed: { opacity: 0.7 },
  noticeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  noticeTime: { ...typography.tiny, color: colors.textFaint, marginLeft: 'auto' },
  noticeTitle: { ...typography.bodyStrong, color: colors.text },
})
