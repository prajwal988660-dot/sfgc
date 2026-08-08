import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import {
  Card,
  Divider,
  EmptyState,
  ErrorState,
  KeyValue,
  LoadingState,
  Pill,
  Screen,
  StatTile,
} from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { colors, radius, spacing, typography } from '@/theme'
import type { MainTabParamList } from '@/navigation/types'
import type { ProgressCard, ProgressRow, ProgressSummary } from '@sfgc/shared'
import { studentSubtitle } from '@sfgc/shared'

type Props = BottomTabScreenProps<MainTabParamList, 'Progress'>

type PillTone = NonNullable<React.ComponentProps<typeof Pill>['tone']>
type TileTone = NonNullable<React.ComponentProps<typeof StatTile>['tone']>

const GRADE_TONE: Record<string, PillTone> = {
  O: 'success',
  'A+': 'success',
  A: 'brand',
  'B+': 'brand',
  B: 'warning',
  C: 'warning',
  F: 'danger',
}

const RESULT_TONE: Record<ProgressSummary['resultStatus'], PillTone> = {
  PASS: 'success',
  FAIL: 'danger',
  PENDING: 'warning',
}

const RESULT_TILE_TONE: Record<ProgressSummary['resultStatus'], TileTone> = {
  PASS: 'success',
  FAIL: 'danger',
  PENDING: 'warning',
}

/** Marks are republished rarely, so only re-fetch on focus after a while. */
const STALE_AFTER_MS = 300_000

export default function ProgressScreen({ navigation }: Props) {
  const { user } = useAuth()
  const [card, setCard] = useState<ProgressCard | null>(null)
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
      const result = await api.progress.mine()
      if (!alive.current) return
      setCard(result)
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

  if (!card) {
    // `loading` distinguishes "still fetching" from "finished with nothing" —
    // without it a failed load with no error message would spin forever.
    if (loading) {
      return (
        <Screen>
          <LoadingState label="Loading your progress card…" />
        </Screen>
      )
    }
    return (
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <ErrorState
          message={error ?? 'Your progress card could not be loaded.'}
          onRetry={() => void load('initial')}
        />
      </Screen>
    )
  }

  const { student, rows, summary } = card
  // The progress card is authoritative, but a freshly created record can carry
  // nulls the signed-in profile already knows about.
  const registerNo = student.registerNo ?? user?.registerNo ?? '—'
  const programme = student.program ?? user?.program ?? '—'
  const semester = card.semester ?? student.semester ?? user?.semester ?? null
  const subtitle = studentSubtitle({
    program: student.program ?? user?.program ?? null,
    semester,
    section: student.section ?? user?.section ?? null,
  })

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {error ? (
        <View style={styles.banner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      <Card style={styles.sheet}>
        <LinearGradient
          colors={[colors.navy, colors.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sheetHeader}
        >
          <View style={styles.crest}>
            <Ionicons name="school" size={20} color={colors.gold} />
          </View>
          <Text style={styles.collegeName}>Seshadripuram First Grade College</Text>
          <Text style={styles.collegePlace}>Yelahanka, Bengaluru</Text>
          <View style={styles.goldRule} />
          <Text style={styles.sheetTitle}>Statement of Marks</Text>
        </LinearGradient>

        <View style={styles.identity}>
          <Text style={styles.studentName}>{student.name}</Text>
          {subtitle ? <Text style={styles.studentSubtitle}>{subtitle}</Text> : null}

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <KeyValue label="Register No" value={registerNo} />
            </View>
            <View style={styles.metaCell}>
              <KeyValue label="Programme" value={programme} />
            </View>
            <View style={styles.metaCell}>
              <KeyValue
                label="Semester"
                value={semester !== null ? `Semester ${semester}` : '—'}
              />
            </View>
            <View style={styles.metaCell}>
              <KeyValue label="Academic Year" value={card.academicYear} />
            </View>
          </View>
        </View>

        <Divider />

        {rows.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Nothing to show yet"
            message="No marks published for this semester yet."
            actionLabel="Refresh"
            onAction={onRefresh}
          />
        ) : (
          <>
            <View style={styles.tableSection}>
              <View style={styles.tableHead}>
                <Text style={styles.headCell}>Internal</Text>
                <Text style={styles.headCell}>External</Text>
                <Text style={styles.headCell}>Total</Text>
              </View>

              {rows.map((row, index) => (
                <View key={row.id}>
                  {index > 0 ? <View style={styles.rowSeparator} /> : null}
                  <MarksRow row={row} />
                </View>
              ))}
            </View>

            <Divider />

            <View style={styles.summary}>
              <View style={styles.summaryHead}>
                <Text style={styles.summaryTitle}>Result</Text>
                <Pill
                  label={summary.resultStatus}
                  tone={RESULT_TONE[summary.resultStatus]}
                  style={styles.summaryPill}
                />
              </View>

              <View style={styles.tileRow}>
                <StatTile
                  value={`${summary.percentage}%`}
                  label="Percentage"
                  tone={RESULT_TILE_TONE[summary.resultStatus]}
                />
                <StatTile value={summary.sgpa.toFixed(2)} label="SGPA" tone="brand" />
              </View>

              <View style={styles.summaryRows}>
                <KeyValue
                  label="Marks obtained"
                  value={`${summary.totalObtained} / ${summary.totalMax}`}
                />
                <KeyValue label="Subjects" value={String(summary.subjectCount)} />
              </View>

              {summary.resultStatus === 'PENDING' ? (
                <View style={styles.note}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.warning}
                  />
                  <Text style={styles.noteText}>
                    Pending means marks for one or more subjects have not been fully
                    published. Your percentage, SGPA and final result will change once the
                    remaining marks are released.
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        )}

        <Text style={styles.disclaimer}>
          System-generated statement. For official transcripts, contact the college office.
        </Text>
      </Card>
    </Screen>
  )
}

function MarksRow({ row }: { row: ProgressRow }) {
  // With neither component recorded, `total` is a placeholder 0 rather than a
  // real score — showing "0 / 100" would read as a fail.
  const awaited = row.internalMarks === null && row.externalMarks === null

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.rowTitle}>
          <Text style={styles.rowCode}>{row.subject.code}</Text>
          <Text style={styles.rowName} numberOfLines={2}>
            {row.subject.name}
          </Text>
          <Text style={styles.rowCredits}>
            {row.credits} {row.credits === 1 ? 'credit' : 'credits'}
          </Text>
        </View>
        <Pill
          label={row.grade ?? '—'}
          tone={row.grade ? (GRADE_TONE[row.grade] ?? 'neutral') : 'neutral'}
        />
      </View>

      <View style={styles.rowCells}>
        <MarkCell value={row.internalMarks} max={row.maxInternal} />
        <MarkCell value={row.externalMarks} max={row.maxExternal} />
        <MarkCell value={awaited ? null : row.total} max={row.maxTotal} strong />
      </View>

      {row.remarks ? (
        <Text style={styles.rowRemarks} numberOfLines={2}>
          {row.remarks}
        </Text>
      ) : null}
    </View>
  )
}

function MarkCell({
  value,
  max,
  strong = false,
}: {
  value: number | null
  max: number
  strong?: boolean
}) {
  return (
    <View style={styles.cell}>
      <Text style={[styles.cellValue, strong && styles.cellValueStrong]}>
        {value === null ? '—' : String(value)}
        <Text style={styles.cellMax}> / {max}</Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningTint,
  },
  bannerText: { ...typography.caption, color: colors.warning, flex: 1 },

  // The card is the "sheet": its own padding is zero so the header can bleed to
  // the rounded edges, and each block below pads itself.
  sheet: { padding: 0, overflow: 'hidden' },

  sheetHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  crest: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: colors.gold,
    marginBottom: spacing.sm,
  },
  collegeName: {
    ...typography.subheading,
    color: colors.textOnBrand,
    textAlign: 'center',
  },
  collegePlace: { ...typography.caption, color: 'rgba(255, 255, 255, 0.72)' },
  goldRule: {
    width: 48,
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    marginVertical: spacing.sm,
  },
  sheetTitle: {
    ...typography.tiny,
    color: colors.gold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },

  identity: { padding: spacing.lg, gap: spacing.xs },
  studentName: { ...typography.title, color: colors.text },
  studentSubtitle: { ...typography.caption, color: colors.textMuted },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
    marginTop: spacing.md,
  },
  metaCell: { width: '50%', paddingRight: spacing.md },

  tableSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  tableHead: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
  },
  headCell: {
    ...typography.tiny,
    color: colors.textFaint,
    textTransform: 'uppercase',
    flex: 1,
  },

  row: { paddingVertical: spacing.md, gap: spacing.sm },
  rowSeparator: { height: 1, backgroundColor: colors.border },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  rowTitle: { flex: 1, gap: 2 },
  rowCode: { ...typography.tiny, color: colors.brand },
  rowName: { ...typography.bodyStrong, color: colors.text },
  rowCredits: { ...typography.caption, color: colors.textFaint },
  rowCells: { flexDirection: 'row' },
  cell: { flex: 1 },
  cellValue: { ...typography.bodyStrong, color: colors.text },
  cellValueStrong: { color: colors.brand },
  cellMax: { ...typography.caption, color: colors.textFaint },
  rowRemarks: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic' },

  summary: { padding: spacing.lg, gap: spacing.md },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: { ...typography.heading, color: colors.text },
  summaryPill: { alignSelf: 'center' },
  tileRow: { flexDirection: 'row', gap: spacing.md },
  summaryRows: { gap: spacing.md },

  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningTint,
  },
  noteText: { ...typography.caption, color: colors.warning, flex: 1, lineHeight: 19 },

  disclaimer: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
})
