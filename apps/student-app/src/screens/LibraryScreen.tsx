import { useCallback, useEffect, useMemo, useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import type { MaterialKind, StudyMaterial } from '@sfgc/shared'
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionTitle,
} from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { colors, radius, spacing, typography } from '@/theme'

/**
 * The library — notes, question papers and solved papers.
 *
 * The list comes from `/materials/mine`, which scopes to the signed-in
 * student's own stream and semester on the server. Nothing is filtered here by
 * course, because the app has no business deciding what a student is entitled
 * to see.
 */

const KIND_META: Record<
  MaterialKind,
  { label: string; icon: keyof typeof Ionicons.glyphMap; tint: string }
> = {
  NOTES: { label: 'Notes', icon: 'document-text-outline', tint: colors.brand },
  QUESTION_PAPER: { label: 'Question paper', icon: 'help-circle-outline', tint: colors.warning },
  SOLVED_PAPER: { label: 'Solved paper', icon: 'checkmark-done-outline', tint: colors.success },
  SYLLABUS: { label: 'Syllabus', icon: 'list-outline', tint: colors.info },
  REFERENCE: { label: 'Reference', icon: 'library-outline', tint: colors.navy },
}

/** Tab order for the filter row. 'ALL' is not a kind, so it is kept separate. */
const FILTERS: ReadonlyArray<{ value: MaterialKind | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'NOTES', label: 'Notes' },
  { value: 'QUESTION_PAPER', label: 'Papers' },
  { value: 'SOLVED_PAPER', label: 'Solved' },
  { value: 'SYLLABUS', label: 'Syllabus' },
]

export default function LibraryScreen() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [filter, setFilter] = useState<MaterialKind | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setLoading(true)
    else setRefreshing(true)
    try {
      setMaterials(await api.materials.mine())
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load('initial')
  }, [load])

  const onRefresh = useCallback(() => {
    void load('refresh')
  }, [load])

  /** Only offer a filter for a kind that is actually on the shelf. */
  const available = useMemo(() => {
    const kinds = new Set(materials.map((material) => material.kind))
    return FILTERS.filter((entry) => entry.value === 'ALL' || kinds.has(entry.value))
  }, [materials])

  const visible = useMemo(
    () => (filter === 'ALL' ? materials : materials.filter((m) => m.kind === filter)),
    [materials, filter],
  )

  async function open(material: StudyMaterial) {
    try {
      const supported = await Linking.canOpenURL(material.fileUrl)
      if (!supported) {
        setError('This file cannot be opened on your phone.')
        return
      }
      await Linking.openURL(material.fileUrl)
    } catch {
      setError('Could not open the file. Check your connection.')
    }
  }

  if (loading && materials.length === 0) {
    return (
      <Screen>
        <LoadingState label="Loading your library…" />
      </Screen>
    )
  }

  if (error && materials.length === 0) {
    return (
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <ErrorState message={error} onRetry={() => void load('initial')} />
      </Screen>
    )
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {error ? (
        <View style={styles.banner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      {available.length > 2 ? (
        <View style={styles.filterRow}>
          {available.map((entry) => {
            const active = filter === entry.value
            return (
              <Pressable
                key={entry.value}
                onPress={() => setFilter(entry.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {entry.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      <SectionTitle
        title={`${visible.length} ${visible.length === 1 ? 'item' : 'items'}`}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="Nothing here yet"
          message="Your teachers have not uploaded anything for your semester. Pull down to check again."
        />
      ) : (
        visible.map((material) => {
          const meta = KIND_META[material.kind]
          return (
            <Pressable
              key={material.id}
              onPress={() => void open(material)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${material.title}`}
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconWrap, { backgroundColor: `${meta.tint}18` }]}>
                    <Ionicons name={meta.icon} size={22} color={meta.tint} />
                  </View>

                  <View style={styles.cardText}>
                    <Text style={styles.title} numberOfLines={2}>
                      {material.title}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {[
                        meta.label,
                        material.subject?.code,
                        material.semester ? `Semester ${material.semester}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    {material.description ? (
                      <Text style={styles.description} numberOfLines={2}>
                        {material.description}
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons
                    name="download-outline"
                    size={20}
                    color={colors.textFaint}
                    style={styles.chevron}
                  />
                </View>
              </Card>
            </Pressable>
          )
        })
      )}
    </Screen>
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
  filterChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { ...typography.caption, color: colors.textMuted },
  filterTextActive: { color: colors.textOnBrand },

  card: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
  title: { ...typography.subheading, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
  description: { ...typography.caption, color: colors.textFaint },
  chevron: { marginLeft: spacing.xs },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningTint,
    marginBottom: spacing.md,
  },
  bannerText: { ...typography.caption, color: colors.text, flex: 1 },
})
