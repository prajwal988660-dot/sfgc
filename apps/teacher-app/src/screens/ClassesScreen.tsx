import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return subjects
    return subjects.filter(
      (subject) =>
        subject.code.toLowerCase().includes(needle) ||
        subject.name.toLowerCase().includes(needle),
    )
  }, [subjects, query])

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

      <SectionTitle
        title={`${filtered.length} of ${subjects.length} ${
          subjects.length === 1 ? 'class' : 'classes'
        }`}
        action={query ? 'Clear' : undefined}
        onAction={query ? () => setQuery('') : undefined}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No matching class"
          message={`Nothing matches “${query.trim()}”. Try the subject code instead.`}
          actionLabel="Clear search"
          onAction={() => setQuery('')}
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

const styles = StyleSheet.create({
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
