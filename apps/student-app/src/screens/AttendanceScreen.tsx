import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Pill,
  Screen,
  SectionTitle,
  StatTile,
} from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { colors, radius, spacing, typography } from '@/theme'
import type { MainTabParamList } from '@/navigation/types'
import type {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceTone,
  StudentAttendance,
  SubjectAttendance,
} from '@sfgc/shared'
import {
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_LABEL,
  ATTENDANCE_THRESHOLD,
  attendanceTone,
  formatDate,
  toDateKey,
} from '@sfgc/shared'

type Props = BottomTabScreenProps<MainTabParamList, 'Attendance'>

type PillTone = NonNullable<React.ComponentProps<typeof Pill>['tone']>

interface RecordSection {
  title: string
  data: AttendanceRecord[]
}

const TONE_COLOR: Record<AttendanceTone, string> = {
  good: colors.success,
  warning: colors.warning,
  danger: colors.danger,
}

const TONE_TINT: Record<AttendanceTone, string> = {
  good: colors.successTint,
  warning: colors.warningTint,
  danger: colors.dangerTint,
}

const TONE_PILL: Record<AttendanceTone, { label: string; tone: PillTone }> = {
  good: { label: 'Meets requirement', tone: 'success' },
  warning: { label: 'At risk', tone: 'warning' },
  danger: { label: 'Below requirement', tone: 'danger' },
}

const STATUS_TONE: Record<AttendanceStatus, PillTone> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LATE: 'warning',
  EXCUSED: 'info',
}

/** Re-fetch on tab focus only if the data has been sitting around this long. */
const STALE_AFTER_MS = 60_000

const REQUIRED_RATIO = ATTENDANCE_THRESHOLD / 100

/**
 * The API counts PRESENT + LATE as attended when it computes `percentage`, so
 * the fraction shown next to a percentage has to count late the same way —
 * otherwise "24/27" would sit beside a percentage derived from 26/27.
 */
function attendedOf(stats: { present: number; late: number }): number {
  return stats.present + stats.late
}

/**
 * Smallest non-negative n where (attended + n) / (total + n) >= the threshold,
 * i.e. how many classes in a row must be attended to climb back to 75%.
 */
function classesNeeded(attended: number, total: number): number {
  if (total <= 0) return 0
  const needed = Math.ceil((REQUIRED_RATIO * total - attended) / (1 - REQUIRED_RATIO))
  return Math.max(0, needed)
}

/**
 * Attendance dates are calendar days ("YYYY-MM-DD"). `new Date("2026-08-08")`
 * parses as UTC midnight, which renders as the previous day in any timezone
 * behind UTC, so build a local Date before handing it to the formatter.
 */
function localDate(key: string): Date {
  const parts = key.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(key)
  }
  return new Date(year, month - 1, day)
}

function dayLabel(key: string): string {
  if (key === toDateKey()) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === toDateKey(yesterday)) return 'Yesterday'
  return formatDate(localDate(key))
}

export default function AttendanceScreen({ navigation }: Props) {
  const [data, setData] = useState<StudentAttendance | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const alive = useRef(true)
  const loadedAt = useRef<number | null>(null)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true)
    else setLoading(true)

    try {
      const result = await api.attendance.mine()
      if (!alive.current) return
      setData(result)
      setError(null)
      loadedAt.current = Date.now()
    } catch (err) {
      if (!alive.current) return
      setError(errorMessage(err))
    } finally {
      if (alive.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    void load('initial')
  }, [load])

  // A teacher may have marked a class while this tab was in the background.
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        const at = loadedAt.current
        if (at !== null && Date.now() - at > STALE_AFTER_MS) void load('refresh')
      }),
    [navigation, load],
  )

  const onRefresh = useCallback(() => {
    void load('refresh')
  }, [load])

  const subjects = useMemo(
    () => [...(data?.bySubject ?? [])].sort((a, b) => a.percentage - b.percentage),
    [data],
  )

  const sections = useMemo<RecordSection[]>(() => {
    const byDate = new Map<string, AttendanceRecord[]>()
    for (const record of data?.records ?? []) {
      const key = record.date.slice(0, 10)
      const bucket = byDate.get(key)
      if (bucket) bucket.push(record)
      else byDate.set(key, [record])
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .map(([title, items]) => ({ title, data: items }))
  }, [data])

  if (!data) {
    // `loading` distinguishes "still fetching" from "finished with nothing" —
    // without it a failed load with no error message would spin forever.
    if (loading) {
      return (
        <Screen>
          <LoadingState label="Loading your attendance…" />
        </Screen>
      )
    }
    return (
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <ErrorState
          message={error ?? 'Your attendance could not be loaded.'}
          onRetry={() => void load('initial')}
        />
      </Screen>
    )
  }

  if (!data.bySubject.length && !data.records.length) {
    return (
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <EmptyState
          icon="calendar-outline"
          title="No attendance yet"
          message="Nothing has been marked for this term. Attendance appears here as soon as your teachers start recording classes."
          actionLabel="Refresh"
          onAction={onRefresh}
        />
      </Screen>
    )
  }

  const { overall } = data
  const overallTone = attendanceTone(overall.percentage)
  const heroPill = TONE_PILL[overallTone]

  const listHeader = (
    <View style={styles.header}>
      <LinearGradient
        colors={[TONE_TINT[overallTone], colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.hero, { borderColor: TONE_COLOR[overallTone] }]}
      >
        <Text style={styles.heroLabel}>Overall attendance</Text>
        <Text style={[styles.heroValue, { color: TONE_COLOR[overallTone] }]}>
          {overall.percentage}%
        </Text>
        <Pill label={heroPill.label} tone={heroPill.tone} style={styles.heroPill} />
        <Text style={styles.heroNote}>
          You need at least {ATTENDANCE_THRESHOLD}% attendance to be eligible for the
          semester examinations.
        </Text>
      </LinearGradient>

      <View style={styles.tileRow}>
        <StatTile value={String(overall.present)} label="Present" tone="success" />
        <StatTile value={String(overall.absent)} label="Absent" tone="danger" />
        <StatTile value={String(overall.total)} label="Total classes" tone="brand" />
      </View>

      {overall.late > 0 ? (
        <Text style={styles.footnote}>
          Includes {overall.late} late {overall.late === 1 ? 'mark' : 'marks'}, which the
          college counts as attended.
        </Text>
      ) : null}

      {subjects.length ? (
        <View style={styles.section}>
          <SectionTitle title="By subject" />
          <Text style={styles.sectionNote}>Lowest attendance first.</Text>
          <View style={styles.subjectList}>
            {subjects.map((subject) => (
              <SubjectCard key={subject.subjectId} subject={subject} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionTitle title="Recent records" />
      </View>
    </View>
  )

  return (
    <Screen scroll={false}>
      {error ? (
        <View style={styles.banner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.dateHeading}>{dayLabel(section.title)}</Text>
        )}
        renderItem={({ item, index, section }) => (
          <View
            style={[
              styles.recordRow,
              index === 0 && styles.recordRowFirst,
              index === section.data.length - 1 && styles.recordRowLast,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: ATTENDANCE_STATUS_COLORS[item.status] },
              ]}
            />
            <View style={styles.recordText}>
              <Text style={styles.recordCode}>{item.subject.code}</Text>
              <Text style={styles.recordName} numberOfLines={1}>
                {item.subject.name}
              </Text>
              {item.remarks ? (
                <Text style={styles.recordRemarks} numberOfLines={2}>
                  {item.remarks}
                </Text>
              ) : null}
            </View>
            <Pill
              label={ATTENDANCE_STATUS_LABEL[item.status]}
              tone={STATUS_TONE[item.status]}
              style={styles.rowPill}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.recordSeparator} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-clear-outline"
            title="No classes recorded yet"
            message="Day-by-day attendance for this term will appear here."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      />
    </Screen>
  )
}

function SubjectCard({ subject }: { subject: SubjectAttendance }) {
  const tone = attendanceTone(subject.percentage)
  const tint = TONE_COLOR[tone]
  const attended = attendedOf(subject)
  const shortfall =
    subject.percentage >= ATTENDANCE_THRESHOLD ? 0 : classesNeeded(attended, subject.total)
  const fill: DimensionValue = `${Math.max(0, Math.min(100, subject.percentage))}%`

  return (
    <Card style={styles.subjectCard}>
      <View style={styles.subjectHead}>
        <View style={styles.subjectHeadText}>
          <Text style={styles.subjectCode}>{subject.code}</Text>
          <Text style={styles.subjectName} numberOfLines={2}>
            {subject.name}
          </Text>
        </View>
        <Text style={[styles.subjectPercent, { color: tint }]}>{subject.percentage}%</Text>
      </View>

      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${subject.name}: ${subject.percentage} percent attendance`}
      >
        <View style={[styles.trackFill, { width: fill, backgroundColor: tint }]} />
      </View>

      <Text style={styles.subjectMeta}>
        {attended} of {subject.total} {subject.total === 1 ? 'class' : 'classes'} attended
      </Text>

      {shortfall > 0 ? (
        <View style={styles.hint}>
          <Ionicons name="warning-outline" size={14} color={colors.warning} />
          <Text style={styles.hintText}>
            Attend {shortfall} more {shortfall === 1 ? 'class' : 'classes'} to reach{' '}
            {ATTENDANCE_THRESHOLD}%
          </Text>
        </View>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  header: { gap: spacing.lg },

  hero: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroLabel: { ...typography.caption, color: colors.textMuted },
  heroValue: { fontSize: 52, fontWeight: '700', letterSpacing: -1.5, lineHeight: 60 },
  heroPill: { alignSelf: 'center' },
  heroNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.xs,
  },

  tileRow: { flexDirection: 'row', gap: spacing.md },
  footnote: { ...typography.caption, color: colors.textFaint, marginTop: -spacing.sm },

  section: { gap: spacing.sm },
  sectionNote: { ...typography.caption, color: colors.textFaint, marginTop: -spacing.xs },
  subjectList: { gap: spacing.md },

  subjectCard: { gap: spacing.sm },
  subjectHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  subjectHeadText: { flex: 1, gap: 2 },
  subjectCode: { ...typography.tiny, color: colors.brand },
  subjectName: { ...typography.bodyStrong, color: colors.text },
  subjectPercent: { ...typography.heading },

  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  trackFill: { height: '100%', borderRadius: radius.pill },

  subjectMeta: { ...typography.caption, color: colors.textMuted },

  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningTint,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  hintText: { ...typography.caption, color: colors.warning, flex: 1 },

  dateHeading: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  recordRowFirst: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  recordRowLast: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  recordSeparator: {
    height: 1,
    marginLeft: spacing.lg,
    backgroundColor: colors.border,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  recordText: { flex: 1, gap: 1 },
  recordCode: { ...typography.bodyStrong, color: colors.text },
  recordName: { ...typography.caption, color: colors.textMuted },
  recordRemarks: { ...typography.caption, color: colors.textFaint, fontStyle: 'italic' },
  rowPill: { alignSelf: 'center' },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningTint,
  },
  bannerText: { ...typography.caption, color: colors.warning, flex: 1 },
})
