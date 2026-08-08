import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import {
  AppButton,
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Pill,
  Screen,
} from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { colors, radius, spacing, typography } from '@/theme'
import type { RootStackParamList } from '@/navigation/types'
import type {
  AttendanceStatus,
  MarkAttendanceInput,
  RosterStudent,
  SubjectRoster,
} from '@sfgc/shared'
import {
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_LABEL,
  formatDate,
  studentSubtitle,
  toDateKey,
} from '@sfgc/shared'

type Props = NativeStackScreenProps<RootStackParamList, 'MarkAttendance'>

/** The statuses a teacher can set from the roster. EXCUSED is admin-only, but
 *  the API may still return it, so a seeded EXCUSED is shown as a badge. */
const SEGMENTS: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE']

type StatusMap = Record<string, AttendanceStatus>

function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function seedFrom(students: RosterStudent[]): StatusMap {
  const seed: StatusMap = {}
  for (const student of students) {
    if (student.todayStatus) seed[student.id] = student.todayStatus
  }
  return seed
}

export default function MarkAttendanceScreen({ route, navigation }: Props) {
  const { subjectId, subjectName, subjectCode } = route.params

  const [date, setDate] = useState<Date>(startOfToday)
  const [roster, setRoster] = useState<SubjectRoster | null>(null)
  /** The server's view of the day — the baseline the local edits are diffed against. */
  const [seed, setSeed] = useState<StatusMap>({})
  const [statuses, setStatuses] = useState<StatusMap>({})

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  /** Set after a blocked submit so the unmarked rows call attention to themselves. */
  const [flagUnmarked, setFlagUnmarked] = useState(false)

  const unmountedRef = useRef(false)
  /** Only the newest roster request is allowed to write state. */
  const requestRef = useRef(0)
  const dirtyRef = useRef(false)
  /** Lets the successful-submit navigation skip the unsaved-changes guard. */
  const leavingRef = useRef(false)

  const dateKey = toDateKey(date)
  const todayKey = toDateKey()
  const isToday = dateKey === todayKey

  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
    }
  }, [])

  // ------------------------------------------------------------------ load --

  const loadRoster = useCallback(
    async (
      key: string,
      mode: 'initial' | 'refresh',
      isActive: () => boolean = () => true,
    ) => {
      const request = ++requestRef.current
      const stale = () => unmountedRef.current || !isActive() || request !== requestRef.current

      if (mode === 'initial') {
        setLoading(true)
        setLoadError(null)
      } else {
        setRefreshing(true)
      }

      try {
        const data = await api.subjects.roster(subjectId, key)
        if (stale()) return

        const fresh = seedFrom(data.students)
        setRoster(data)
        setSeed(fresh)
        // A refresh must never throw away marks the teacher has not submitted.
        const keepEdits = mode === 'refresh' && dirtyRef.current
        if (!keepEdits) setStatuses(fresh)
        setLoadError(null)
        setSubmitError(null)
        setFlagUnmarked(false)
      } catch (err) {
        if (stale()) return
        setLoadError(errorMessage(err))
      } finally {
        if (!stale()) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [subjectId],
  )

  useEffect(() => {
    let cancelled = false
    void loadRoster(dateKey, 'initial', () => !cancelled)
    return () => {
      cancelled = true
    }
  }, [dateKey, loadRoster])

  const handleRefresh = useCallback(() => {
    void loadRoster(dateKey, 'refresh')
  }, [dateKey, loadRoster])

  // --------------------------------------------------------------- derived --

  const students = useMemo(() => roster?.students ?? [], [roster])

  const dirty = useMemo(() => {
    const ids = new Set([...Object.keys(seed), ...Object.keys(statuses)])
    for (const id of ids) {
      if (seed[id] !== statuses[id]) return true
    }
    return false
  }, [seed, statuses])

  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty])

  const alreadyMarked = useMemo(
    () => students.some((student) => student.todayStatus !== null),
    [students],
  )

  const counts = useMemo(() => {
    let present = 0
    let absent = 0
    let late = 0
    let excused = 0
    for (const student of students) {
      switch (statuses[student.id]) {
        case 'PRESENT':
          present += 1
          break
        case 'ABSENT':
          absent += 1
          break
        case 'LATE':
          late += 1
          break
        case 'EXCUSED':
          excused += 1
          break
        default:
          break
      }
    }
    const marked = present + absent + late + excused
    return {
      present,
      absent,
      late,
      excused,
      marked,
      total: students.length,
      unmarked: students.length - marked,
    }
  }, [students, statuses])

  // ----------------------------------------------------------------- edits --

  const handleSelect = useCallback((studentId: string, status: AttendanceStatus) => {
    setStatuses((prev) => (prev[studentId] === status ? prev : { ...prev, [studentId]: status }))
  }, [])

  const markAllPresent = useCallback(() => {
    setStatuses(() => {
      const next: StatusMap = {}
      for (const student of students) next[student.id] = 'PRESENT'
      return next
    })
    setFlagUnmarked(false)
  }, [students])

  const clearAll = useCallback(() => {
    if (counts.marked === 0) return
    Alert.alert('Clear all marks?', 'Every student on this list will go back to unmarked.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: () => setStatuses({}) },
    ])
  }, [counts.marked])

  // ------------------------------------------------------------------ date --

  const shiftDay = useCallback((delta: number) => {
    setDate((prev) => {
      const next = new Date(prev)
      next.setDate(next.getDate() + delta)
      next.setHours(0, 0, 0, 0)
      // Attendance cannot be recorded for a day that has not happened.
      if (toDateKey(next) > toDateKey()) return prev
      return next
    })
  }, [])

  const goToToday = useCallback(() => setDate(startOfToday()), [])

  // ---------------------------------------------------------------- submit --

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    if (students.length === 0) return

    const records: MarkAttendanceInput['records'] = []
    for (const student of students) {
      const status = statuses[student.id]
      if (status) records.push({ studentId: student.id, status })
    }

    const unmarked = students.length - records.length
    if (unmarked > 0) {
      setFlagUnmarked(true)
      Alert.alert(
        'Attendance is incomplete',
        `${unmarked} of ${students.length} student${students.length === 1 ? '' : 's'} ` +
          `still ${unmarked === 1 ? 'has' : 'have'} no status. Mark everyone before submitting.`,
      )
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await api.attendance.mark({ subjectId, date: dateKey, records })
      if (unmountedRef.current) return

      // Baseline the saved state so the unsaved-changes guard stays quiet.
      setSeed(statuses)
      dirtyRef.current = false

      Alert.alert(
        'Attendance saved',
        `${result.marked} student${result.marked === 1 ? '' : 's'} marked for ${formatDate(date)}.`,
        [
          {
            text: 'Done',
            onPress: () => {
              leavingRef.current = true
              navigation.goBack()
            },
          },
        ],
        { cancelable: false },
      )
    } catch (err) {
      if (unmountedRef.current) return
      setSubmitError(errorMessage(err))
    } finally {
      if (!unmountedRef.current) setSubmitting(false)
    }
  }, [submitting, students, statuses, subjectId, dateKey, date, navigation])

  // Unsaved marks must survive a stray back-swipe.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (leavingRef.current || !dirtyRef.current) return
      event.preventDefault()
      Alert.alert(
        'Discard attendance?',
        'These marks have not been submitted. Leaving now loses them.',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              leavingRef.current = true
              navigation.dispatch(event.data.action)
            },
          },
        ],
      )
    })
    return unsubscribe
  }, [navigation])

  // ---------------------------------------------------------------- render --

  const dateBar = (
    <View style={styles.dateBar}>
      <Pressable
        onPress={() => shiftDay(-1)}
        accessibilityRole="button"
        accessibilityLabel="Previous day"
        style={({ pressed }) => [styles.dateNav, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={20} color={colors.brand} />
      </Pressable>

      <View style={styles.dateCenter}>
        <Text style={styles.dateText} numberOfLines={1}>
          {formatDate(date)}
        </Text>
        <Text style={styles.dateSub} numberOfLines={1}>
          {date.toLocaleDateString('en-IN', { weekday: 'long' })}
          {isToday ? ' · Today' : ''}
        </Text>
      </View>

      <Pressable
        onPress={() => shiftDay(1)}
        disabled={isToday}
        accessibilityRole="button"
        accessibilityLabel="Next day"
        accessibilityState={{ disabled: isToday }}
        style={({ pressed }) => [
          styles.dateNav,
          isToday && styles.dateNavDisabled,
          pressed && !isToday && styles.pressed,
        ]}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isToday ? colors.textFaint : colors.brand}
        />
      </Pressable>

      <AppButton
        label="Today"
        onPress={goToToday}
        variant="secondary"
        small
        fullWidth={false}
        disabled={isToday}
        style={styles.todayButton}
      />
    </View>
  )

  const listHeader = (
    <View style={styles.header}>
      <Card style={styles.subjectCard}>
        <Text style={styles.subjectName} numberOfLines={2}>
          {subjectName}
        </Text>
        <Text style={styles.subjectMeta} numberOfLines={1}>
          {[subjectCode, roster ? studentSubtitle(roster.subject) : '']
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </Card>

      {dateBar}

      {alreadyMarked ? (
        <View style={styles.banner}>
          <Ionicons name="information-circle" size={18} color={colors.info} />
          <Text style={styles.bannerText}>
            Already marked — you are editing. Submitting overwrites this day.
          </Text>
        </View>
      ) : null}

      <View style={styles.bulkRow}>
        <AppButton
          label="Mark all present"
          onPress={markAllPresent}
          icon="checkmark-done-outline"
          variant="secondary"
          fullWidth={false}
          style={styles.bulkPrimary}
        />
        <AppButton
          label="Clear all"
          onPress={clearAll}
          variant="outline"
          fullWidth={false}
          disabled={counts.marked === 0}
          style={styles.bulkSecondary}
        />
      </View>
    </View>
  )

  const renderItem = useCallback(
    ({ item }: { item: RosterStudent }) => (
      <StudentRow
        student={item}
        status={statuses[item.id]}
        onSelect={handleSelect}
        flagUnmarked={flagUnmarked}
      />
    ),
    [statuses, handleSelect, flagUnmarked],
  )

  const extraData = useMemo(() => ({ statuses, flagUnmarked }), [statuses, flagUnmarked])

  let body: React.ReactNode
  if (loading) {
    body = (
      <View style={styles.stateWrap}>
        {dateBar}
        <LoadingState label="Loading roster…" />
      </View>
    )
  } else if (loadError) {
    body = (
      <View style={styles.stateWrap}>
        {dateBar}
        <ErrorState message={loadError} onRetry={() => void loadRoster(dateKey, 'initial')} />
      </View>
    )
  } else if (students.length === 0) {
    body = (
      <View style={styles.stateWrap}>
        {dateBar}
        <EmptyState
          icon="people-outline"
          title="No students enrolled"
          message={`Nobody is enrolled in ${subjectCode} yet. Ask the office to enrol students before marking attendance.`}
          actionLabel="Reload"
          onAction={() => void loadRoster(dateKey, 'initial')}
        />
      </View>
    )
  } else {
    body = (
      <FlatList
        data={students}
        keyExtractor={(student) => student.id}
        renderItem={renderItem}
        extraData={extraData}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={11}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    )
  }

  return (
    <Screen scroll={false} edges={['bottom']}>
      <View style={styles.flex}>{body}</View>

      {students.length > 0 && !loading && !loadError ? (
        <View style={styles.footer}>
          {submitError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{submitError}</Text>
              <AppButton
                label="Retry"
                onPress={() => void handleSubmit()}
                variant="ghost"
                small
                fullWidth={false}
                style={styles.retryButton}
              />
            </View>
          ) : null}

          <View style={styles.summaryRow}>
            <SummaryChip
              value={counts.present}
              label="Present"
              color={ATTENDANCE_STATUS_COLORS.PRESENT}
            />
            <SummaryChip
              value={counts.absent}
              label="Absent"
              color={ATTENDANCE_STATUS_COLORS.ABSENT}
            />
            <SummaryChip value={counts.late} label="Late" color={ATTENDANCE_STATUS_COLORS.LATE} />
            {counts.excused > 0 ? (
              <SummaryChip
                value={counts.excused}
                label="Excused"
                color={ATTENDANCE_STATUS_COLORS.EXCUSED}
              />
            ) : null}
            <SummaryChip
              value={counts.unmarked}
              label="Unmarked"
              color={counts.unmarked > 0 ? colors.warning : colors.textFaint}
            />
          </View>

          <AppButton
            label={
              alreadyMarked
                ? `Update ${counts.total} students`
                : `Submit ${counts.total} students`
            }
            onPress={() => void handleSubmit()}
            icon="checkmark-circle-outline"
            loading={submitting}
            disabled={refreshing}
          />
        </View>
      ) : null}
    </Screen>
  )
}

// ------------------------------------------------------------------- pieces --

/** Memoised so tapping one segment does not re-render forty rows. */
const StudentRow = React.memo(function StudentRow({
  student,
  status,
  onSelect,
  flagUnmarked,
}: {
  student: RosterStudent
  status: AttendanceStatus | undefined
  onSelect: (studentId: string, status: AttendanceStatus) => void
  flagUnmarked: boolean
}) {
  const missing = flagUnmarked && !status

  return (
    <View style={[styles.row, missing && styles.rowMissing]}>
      <Avatar name={student.name} size={38} />

      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {student.name}
        </Text>
        <View style={styles.rowMetaLine}>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {student.registerNo ?? 'No register no.'}
          </Text>
          {status === 'EXCUSED' ? (
            <Pill label={ATTENDANCE_STATUS_LABEL.EXCUSED} tone="info" style={styles.excusedPill} />
          ) : null}
        </View>
      </View>

      <View style={styles.segmentGroup}>
        {SEGMENTS.map((option) => {
          const selected = status === option
          const tint = ATTENDANCE_STATUS_COLORS[option]
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(student.id, option)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Mark ${student.name} ${ATTENDANCE_STATUS_LABEL[option]}`}
              style={({ pressed }) => [
                styles.segment,
                selected && { backgroundColor: tint },
                pressed && !selected && styles.segmentPressed,
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: selected ? colors.textOnBrand : colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {ATTENDANCE_STATUS_LABEL[option]}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
})

function SummaryChip({
  value,
  label,
  color,
}: {
  value: number
  label: string
  color: string
}) {
  return (
    <View style={styles.chip} accessibilityLabel={`${value} ${label}`}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

// ------------------------------------------------------------------ styles --

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },

  stateWrap: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },

  header: { gap: spacing.md, marginBottom: spacing.sm },

  subjectCard: { padding: spacing.md, gap: 2 },
  subjectName: { ...typography.subheading, color: colors.text },
  subjectMeta: { ...typography.caption, color: colors.textMuted },

  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xs,
  },
  dateNav: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  dateNavDisabled: { opacity: 0.45 },
  dateCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dateText: { ...typography.bodyStrong, color: colors.text },
  dateSub: { ...typography.caption, color: colors.textMuted },
  todayButton: { height: 44, paddingHorizontal: spacing.md },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.infoTint,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bannerText: { ...typography.caption, color: colors.info, flex: 1 },

  bulkRow: { flexDirection: 'row', gap: spacing.sm },
  bulkPrimary: { flex: 2 },
  bulkSecondary: { flex: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowMissing: { borderColor: colors.warning, backgroundColor: colors.warningTint },
  rowText: { flex: 1, gap: 2 },
  rowName: { ...typography.bodyStrong, color: colors.text },
  rowMetaLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowMeta: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
  excusedPill: { paddingHorizontal: spacing.sm, paddingVertical: 2 },

  segmentGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    gap: 2,
  },
  segment: {
    width: 46,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentPressed: { backgroundColor: colors.border },
  segmentLabel: { ...typography.tiny, letterSpacing: 0 },

  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  chipValue: { ...typography.heading },
  chipLabel: { ...typography.tiny, color: colors.textMuted },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerTint,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.danger, flex: 1 },
  retryButton: { height: 44, paddingHorizontal: spacing.md },
})
