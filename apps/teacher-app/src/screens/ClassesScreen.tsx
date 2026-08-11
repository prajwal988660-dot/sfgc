import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { Subject } from '@sfgc/shared'
import { studentSubtitle } from '@sfgc/shared'

import {
  AppButton,
  AppInput,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Pill,
  Screen,
  SectionTitle,
} from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { colors, radius, spacing, typography } from '@/theme'
import type { RootStackParamList } from '@/navigation/types'

/** Fixed palette for the card's left rule — one hue per subject, stable. */
const RULE_COLORS = [
  colors.brand,
  colors.maroon,
  colors.gold,
  colors.info,
  colors.success,
  colors.warning,
] as const

/**
 * A stable hash of the subject code, so BCA301 keeps the same colour on every
 * launch and on every device. Deliberately not random.
 */
function ruleColorFor(code: string): string {
  let hash = 0
  for (let index = 0; index < code.length; index += 1) {
    hash = (hash * 31 + code.charCodeAt(index)) % 1_000_003
  }
  return RULE_COLORS[hash % RULE_COLORS.length] ?? colors.brand
}

export default function ClassesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [query, setQuery] = useState('')
  /** Empty means "every stream" / "every semester". */
  const [stream, setStream] = useState('')
  const [semester, setSemester] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const list = await api.subjects.list()
      if (!mountedRef.current) return
      setSubjects(list)
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

  /**
   * The streams and semesters this teacher actually has classes in.
   *
   * Derived from their own subject list rather than fetched: offering a filter
   * for a stream they do not teach would only ever return nothing.
   */
  const streams = useMemo(
    () => [...new Set(subjects.map((subject) => subject.program))].sort(),
    [subjects],
  )

  const semesters = useMemo(
    () =>
      [
        ...new Set(
          subjects
            .filter((subject) => !stream || subject.program === stream)
            .map((subject) => subject.semester),
        ),
      ].sort((a, b) => a - b),
    [subjects, stream],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return subjects.filter((subject) => {
      if (stream && subject.program !== stream) return false
      if (semester !== null && subject.semester !== semester) return false
      if (!needle) return true
      return (
        subject.code.toLowerCase().includes(needle) ||
        subject.name.toLowerCase().includes(needle)
      )
    })
  }, [subjects, query, stream, semester])

  const filtersActive = Boolean(query) || Boolean(stream) || semester !== null

  const clearFilters = useCallback(() => {
    setQuery('')
    setStream('')
    setSemester(null)
  }, [])

  const goToAttendance = useCallback(
    (subject: Subject) => {
      navigation.navigate('MarkAttendance', {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
      })
    },
    [navigation],
  )

  const goToReport = useCallback(
    (subject: Subject) => {
      navigation.navigate('ClassReport', {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
      })
    },
    [navigation],
  )

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading your classes…" />
      </Screen>
    )
  }

  if (error && subjects.length === 0) {
    return (
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <ErrorState message={error} onRetry={() => void load('initial')} />
      </Screen>
    )
  }

  if (subjects.length === 0) {
    return (
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <EmptyState
          icon="people-outline"
          title="No classes assigned"
          message="An administrator assigns classes to your account. Once a subject is assigned to you it will appear here, ready for attendance."
        />
      </Screen>
    )
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <AppInput
        placeholder="Search by code or name"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Search classes"
      />

      {streams.length > 1 ? (
        <View style={styles.filterRow}>
          <FilterChip label="All streams" active={!stream} onPress={() => setStream('')} />
          {streams.map((name) => (
            <FilterChip
              key={name}
              label={name}
              active={stream === name}
              onPress={() => {
                setStream(name)
                // The semester list is scoped to the stream, so a semester
                // picked under the previous one may no longer exist.
                setSemester(null)
              }}
            />
          ))}
        </View>
      ) : null}

      {semesters.length > 1 ? (
        <View style={styles.filterRow}>
          <FilterChip
            label="All semesters"
            active={semester === null}
            onPress={() => setSemester(null)}
          />
          {semesters.map((number) => (
            <FilterChip
              key={number}
              label={`Sem ${number}`}
              active={semester === number}
              onPress={() => setSemester(number)}
            />
          ))}
        </View>
      ) : null}

      <SectionTitle
        title={`${filtered.length} of ${subjects.length} ${
          subjects.length === 1 ? 'class' : 'classes'
        }`}
        action={filtersActive ? 'Clear' : undefined}
        onAction={filtersActive ? clearFilters : undefined}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No matching class"
          message="No class matches these filters."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        filtered.map((subject) => (
          <Card key={subject.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View
                style={[styles.rule, { backgroundColor: ruleColorFor(subject.code) }]}
              />
              <View style={styles.cardBody}>
                <Pill label={subject.code} tone="brand" />
                <Text style={styles.name} numberOfLines={2}>
                  {subject.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {studentSubtitle(subject)}
                </Text>

                <View style={styles.countRow}>
                  <Ionicons name="people-outline" size={15} color={colors.textMuted} />
                  <Text style={styles.countText}>
                    {subject.studentCount ?? 0}{' '}
                    {subject.studentCount === 1 ? 'student' : 'students'}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <AppButton
                    label="Mark attendance"
                    icon="checkbox-outline"
                    onPress={() => goToAttendance(subject)}
                    fullWidth={false}
                    style={styles.action}
                  />
                  <AppButton
                    label="View report"
                    icon="bar-chart-outline"
                    variant="outline"
                    onPress={() => goToReport(subject)}
                    fullWidth={false}
                    style={styles.action}
                  />
                </View>
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  )
}

/** A one-tap filter toggle. Chips beat a dropdown here — there are only ever a
 *  handful of streams, and a teacher marking attendance is in a hurry. */
function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.textOnBrand,
  },
  // Padding moves onto the body so the coloured rule can sit flush.
  card: { padding: 0, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'stretch' },
  rule: { width: 6, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg },
  cardBody: { flex: 1, padding: spacing.lg, gap: spacing.xs },

  name: { ...typography.subheading, color: colors.text, marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.textMuted },

  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  countText: { ...typography.caption, color: colors.textMuted },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  action: { flex: 1, paddingHorizontal: spacing.md },
})
