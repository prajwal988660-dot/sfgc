import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import {
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
import { colors, radius, spacing, typography } from '@/theme'
import type { RootStackParamList } from '@/navigation/types'
import type {
  AttendanceStatus,
  ClassAttendance,
  ClassAttendanceStudent,
} from '@sfgc/shared'
import {
  ATTENDANCE_STATUS_LABEL,
  ATTENDANCE_THRESHOLD,
  attendanceTone,
  formatDate,
  toDateKey,
} from '@sfgc/shared'

type Props = NativeStackScreenProps<RootStackParamList, 'ClassReport'>

/** Lowest attendance first surfaces at-risk students; register order for roll call. */
type SortMode = 'attendance' | 'register'

const STATUS_TONE: Record<AttendanceStatus, 'success' | 'danger' | 'warning' | 'info'> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LATE: 'warning',
  EXCUSED: 'info',
}

const TONE_COLOR = {
  good: colors.success,
  warning: colors.warning,
  danger: colors.danger,
} as const

const TONE_TILE: Record<keyof typeof TONE_COLOR, 'success' | 'warning' | 'danger'> = {
  good: 'success',
  warning: 'warning',
  danger: 'danger',
}

/**
 * "2026-08-08" parsed at *local* midnight. `new Date('2026-08-08')` is UTC
 * midnight, which renders as the previous day west of Greenwich.
 */
function parseDateKey(key: string): Date {
  const parts = key.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date()
  }
  return new Date(year, month - 1, day)
}

function shiftDateKey(key: string, days: number): string {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

function compareRegisterNo(a: ClassAttendanceStudent, b: ClassAttendanceStudent): number {
  // Students without a register number sink to the bottom of a roll-call list.
  if (!a.registerNo && !b.registerNo) return a.name.localeCompare(b.name)
  if (!a.registerNo) return 1
  if (!b.registerNo) return -1
  return a.registerNo.localeCompare(b.registerNo, 'en', { numeric: true })
}

export default function ClassReportScreen({ route }: Props) {
  const { subjectId, subjectName, subjectCode } = route.params

  const [date, setDate] = useState<string>(() => toDateKey())
  const [sortMode, setSortMode] = useState<SortMode>('attendance')
  const [report, setReport] = useState<ClassAttendance | null>(null)
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

  // Monotonic id so a slow response for an old date cannot overwrite a new one.
  const requestId = useRef(0)

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const id = ++requestId.current
      if (mode === 'refresh') setRefreshing(true)
      else setLoading(true)

      try {
        const result = await api.attendance.forClass(subjectId, { date })
        if (!mounted.current || id !== requestId.current) return
        setReport(result)
        setError(null)
      } catch (err) {
        if (!mounted.current || id !== requestId.current) return
        setReport(null)
        setError(errorMessage(err))
      } finally {
        if (mounted.current && id === requestId.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [subjectId, date],
  )

  useEffect(() => {
    void load('initial')
  }, [load])

  const students = useMemo(() => {
    if (!report) return []
    const list = [...report.students]
    if (sortMode === 'attendance') {
      list.sort(
        (a, b) =>
          a.stats.percentage - b.stats.percentage || a.name.localeCompare(b.name),
      )
    } else {
      list.sort(compareRegisterNo)
    }
    return list
  }, [report, sortMode])

  const today = toDateKey()
  const isToday = date === today
  const summary = report?.summary
  const summaryTone = summary ? attendanceTone(summary.percentage) : 'good'
  const notMarked = Boolean(report) && (summary?.total ?? 0) === 0

  return (
    <Screen refreshing={refreshing} onRefresh={() => void load('refresh')}>
      <Card>
        <Text style={styles.subjectName}>{report?.subject.name ?? subjectName}</Text>
        <Text style={styles.subjectMeta}>
          {report?.subject.code ?? subjectCode}
          {report?.subject.section ? ` · Section ${report.subject.section}` : ''}
          {report ? ` · Semester ${report.subject.semester}` : ''}
        </Text>
      </Card>

      {/* Date stepper — the same affordance the marking screen uses. */}
      <Card style={styles.stepper}>
        <Pressable
          onPress={() => setDate((current) => shiftDateKey(current, -1))}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.brand} />
        </Pressable>

        <View style={styles.stepperCenter}>
          <Text style={styles.stepperDate}>{formatDate(parseDateKey(date))}</Text>
          <Text style={styles.stepperHint}>
            {isToday
              ? 'Today'
              : parseDateKey(date).toLocaleDateString('en-IN', { weekday: 'long' })}
          </Text>
        </View>

        <Pressable
          onPress={() => setDate((current) => shiftDateKey(current, 1))}
          disabled={isToday}
          accessibilityRole="button"
          accessibilityLabel="Next day"
          accessibilityState={{ disabled: isToday }}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && !isToday && styles.stepButtonPressed,
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isToday ? colors.textFaint : colors.brand}
          />
        </Pressable>
      </Card>

      {!isToday ? (
        <Pressable
          onPress={() => setDate(today)}
          accessibilityRole="button"
          accessibilityLabel="Jump to today"
          style={styles.jumpToday}
        >
          <Ionicons name="today-outline" size={16} color={colors.brand} />
          <Text style={styles.jumpTodayText}>Jump to today</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <LoadingState label="Loading the class report…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load('initial')} />
      ) : !report ? (
        <ErrorState
          message="The report could not be read."
          onRetry={() => void load('initial')}
        />
      ) : (
        <>
          {summary ? (
            <>
              <View style={styles.tiles}>
                <StatTile value={String(summary.present)} label="Present" tone="success" />
                <StatTile value={String(summary.absent)} label="Absent" tone="danger" />
                <StatTile
                  value={`${summary.percentage.toFixed(1)}%`}
                  label="Attendance"
                  tone={TONE_TILE[summaryTone]}
                />
              </View>
              <Text style={styles.summaryCaption}>
                {report.students.length} student
                {report.students.length === 1 ? '' : 's'} on the roll
                {summary.late > 0 ? ` · ${summary.late} marked late` : ''}
              </Text>
            </>
          ) : null}

          {notMarked ? (
            <Card style={styles.noticeCard}>
              <Ionicons name="information-circle-outline" size={20} color={colors.info} />
              <Text style={styles.noticeText}>
                Attendance has not been marked for this day. Cumulative figures below are
                still up to date.
              </Text>
            </Card>
          ) : null}

          <SectionTitle title="Students" />

          <View style={styles.segment}>
            <Pressable
              onPress={() => setSortMode('attendance')}
              accessibilityRole="button"
              accessibilityState={{ selected: sortMode === 'attendance' }}
              style={[
                styles.segmentButton,
                sortMode === 'attendance' && styles.segmentButtonActive,
              ]}
            >
              <Ionicons
                name="trending-down"
                size={16}
                color={sortMode === 'attendance' ? colors.textOnBrand : colors.textMuted}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  sortMode === 'attendance' && styles.segmentLabelActive,
                ]}
              >
                Lowest first
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSortMode('register')}
              accessibilityRole="button"
              accessibilityState={{ selected: sortMode === 'register' }}
              style={[
                styles.segmentButton,
                sortMode === 'register' && styles.segmentButtonActive,
              ]}
            >
              <Ionicons
                name="list"
                size={16}
                color={sortMode === 'register' ? colors.textOnBrand : colors.textMuted}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  sortMode === 'register' && styles.segmentLabelActive,
                ]}
              >
                Register no
              </Text>
            </Pressable>
          </View>

          {students.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No students enrolled"
              message="Once students are enrolled in this subject they will appear here."
            />
          ) : (
            <Card style={styles.listCard}>
              {students.map((student, index) => {
                const tone = attendanceTone(student.stats.percentage)
                const atRisk = student.stats.percentage < ATTENDANCE_THRESHOLD
                return (
                  <View key={student.id}>
                    {index > 0 ? <Divider style={styles.rowDivider} /> : null}
                    <View style={styles.row}>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {student.name}
                        </Text>
                        <Text style={styles.rowRegister}>
                          {student.registerNo ?? 'No register number'}
                        </Text>
                        <View style={styles.rowStatsLine}>
                          <Text style={[styles.rowStats, { color: TONE_COLOR[tone] }]}>
                            {student.stats.present}/{student.stats.total} ·{' '}
                            {student.stats.percentage.toFixed(1)}%
                          </Text>
                          {atRisk ? <Pill label="Below 75%" tone="warning" /> : null}
                        </View>
                      </View>

                      <View style={styles.rowRight}>
                        {student.status ? (
                          <Pill
                            label={ATTENDANCE_STATUS_LABEL[student.status]}
                            tone={STATUS_TONE[student.status]}
                          />
                        ) : (
                          <Pill label="Not marked" tone="neutral" />
                        )}
                      </View>
                    </View>
                  </View>
                )
              })}
            </Card>
          )}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  subjectName: { ...typography.heading, color: colors.text },
  subjectMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  stepButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  stepButtonPressed: { opacity: 0.7 },
  stepperCenter: { flex: 1, alignItems: 'center' },
  stepperDate: { ...typography.subheading, color: colors.text },
  stepperHint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  jumpToday: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  jumpTodayText: { ...typography.caption, color: colors.brand },

  tiles: { flexDirection: 'row', gap: spacing.md },
  summaryCaption: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },

  noticeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  noticeText: { ...typography.caption, color: colors.textMuted, flex: 1, lineHeight: 19 },

  segment: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    marginTop: -spacing.sm,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  segmentButtonActive: { backgroundColor: colors.brand },
  segmentLabel: { ...typography.caption, color: colors.textMuted },
  segmentLabelActive: { color: colors.textOnBrand },

  listCard: { paddingVertical: spacing.sm },
  rowDivider: { marginVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowMain: { flex: 1, gap: 2 },
  rowName: { ...typography.bodyStrong, color: colors.text },
  rowRegister: { ...typography.caption, color: colors.textFaint },
  rowStatsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  rowStats: { ...typography.caption },
  rowRight: { alignItems: 'flex-end' },
})
