import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import type { Event, PaginationMeta } from '@sfgc/shared'
import { formatFee } from '@sfgc/shared'

import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Pill,
  Screen,
} from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import type { RootStackParamList } from '@/navigation/types'
import { colors, radius, spacing, typography } from '@/theme'

type EventFilter = 'upcoming' | 'past'

const SEGMENTS: ReadonlyArray<{ value: EventFilter; label: string }> = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

/**
 * Cover colours per category. Categories are free text on the backend, so the
 * lookup is lower-cased and always falls back to the house gradient — a new
 * category invented by the office still renders correctly.
 */
const CATEGORY_GRADIENTS: Record<string, readonly [string, string]> = {
  fest: [colors.brand, colors.brandLight],
  cultural: ['#5b2a86', '#9d4edd'],
  technical: [colors.navy, colors.info],
  tech: [colors.navy, colors.info],
  workshop: ['#0b4f4a', '#12897f'],
  seminar: ['#1e3a8a', '#4c6ef5'],
  webinar: ['#3730a3', '#6d6ce6'],
  sports: ['#14532d', colors.success],
  placement: ['#8a6d13', colors.gold],
  competition: ['#7f1d1d', '#e0563f'],
  alumni: ['#134e4a', '#3c8f92'],
  orientation: ['#4a2c6b', '#8b5cf6'],
  academic: ['#0f2b56', '#3b6fb3'],
}

const DEFAULT_GRADIENT: readonly [string, string] = [colors.navy, colors.brand]

export function gradientForCategory(category: string): readonly [string, string] {
  return CATEGORY_GRADIENTS[category.trim().toLowerCase()] ?? DEFAULT_GRADIENT
}

export default function EventsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [filter, setFilter] = useState<EventFilter>('upcoming')
  const [events, setEvents] = useState<Event[] | null>(null)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const query =
          filter === 'upcoming'
            ? { upcoming: true, limit: 20 }
            : { past: true, limit: 20 }
        const result = await api.events.list(query)
        if (cancelled) return
        setEvents(result.items)
        setMeta(result.meta)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(errorMessage(err))
        setEvents(null)
        setMeta(null)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [filter, reloadKey])

  // Coming back from EventDetail after registering must not leave a stale
  // "Registered" state on the card, so re-focusing quietly refetches. The first
  // focus is skipped because the effect above has already fired for it.
  const focusedBefore = useRef(false)
  useFocusEffect(
    useCallback(() => {
      if (!focusedBefore.current) {
        focusedBefore.current = true
        return
      }
      setReloadKey((key) => key + 1)
    }, []),
  )

  const selectFilter = useCallback(
    (next: EventFilter) => {
      if (next === filter) return
      setFilter(next)
      setEvents(null)
      setMeta(null)
      setError(null)
      setLoading(true)
    },
    [filter],
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
    setLoading(true)
    setReloadKey((key) => key + 1)
  }, [])

  const openEvent = useCallback(
    (event: Event) => {
      navigation.navigate('EventDetail', { eventId: event.id, title: event.title })
    },
    [navigation],
  )

  const countLabel =
    meta && meta.total > 0
      ? `${meta.total} ${filter === 'upcoming' ? 'upcoming' : 'past'} ${
          meta.total === 1 ? 'event' : 'events'
        }`
      : null

  return (
    <Screen refreshing={refreshing} onRefresh={handleRefresh}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campus events</Text>
        <Text style={styles.headerSubtitle}>
          Fests, workshops and seminars at Seshadripuram First Grade College. Register
          from here and keep your ticket code handy.
        </Text>
      </View>

      <View style={styles.segmented} accessibilityRole="tablist">
        {SEGMENTS.map((segment) => {
          const active = segment.value === filter
          return (
            <Pressable
              key={segment.value}
              onPress={() => selectFilter(segment.value)}
              accessibilityRole="tab"
              accessibilityLabel={`${segment.label} events`}
              accessibilityState={{ selected: active }}
              style={[styles.segment, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                {segment.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {loading ? (
        <LoadingState label="Loading events…" />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRetry} />
      ) : !events || events.length === 0 ? (
        <EmptyState
          icon="sparkles-outline"
          title={filter === 'upcoming' ? 'No events coming up' : 'No past events'}
          message={
            filter === 'upcoming'
              ? 'Nothing is scheduled right now. Pull down to check again — new events appear here as soon as the office publishes them.'
              : 'Events that have already happened will be listed here.'
          }
          actionLabel={filter === 'upcoming' ? undefined : 'See upcoming'}
          onAction={filter === 'upcoming' ? undefined : () => selectFilter('upcoming')}
        />
      ) : (
        <View style={styles.list}>
          {countLabel ? <Text style={styles.count}>{countLabel}</Text> : null}
          {events.map((event) => (
            <EventCard key={event.id} event={event} onPress={() => openEvent(event)} />
          ))}
        </View>
      )}
    </Screen>
  )
}

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const start = new Date(event.startsAt)
  const validStart = !Number.isNaN(start.getTime())
  const day = validStart ? String(start.getDate()) : '–'
  const month = validStart
    ? start.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()
    : ''
  const time = validStart
    ? start.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    : '—'

  const isFull = event.seatsLeft !== null && event.seatsLeft <= 0

  return (
    <Card onPress={onPress} style={styles.card}>
      <LinearGradient
        colors={gradientForCategory(event.category)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cover}
      >
        <View style={styles.dateChip}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{month}</Text>
        </View>
        <Pill label={event.category} tone="neutral" />
      </LinearGradient>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {event.venue ?? 'Venue to be announced'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={15} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {time}
          </Text>
        </View>

        {event.capacity !== null ? (
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={15} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {isFull
                ? `All ${event.capacity} seats taken`
                : `${event.seatsLeft ?? 0} of ${event.capacity} seats left`}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.feeChip}>
            <Ionicons name="pricetag-outline" size={13} color={colors.brand} />
            <Text style={styles.feeText}>{formatFee(event.fee)}</Text>
          </View>

          {event.isRegistered ? <Pill label="Registered" tone="success" /> : null}
          {!event.registrationOpen ? <Pill label="Closed" tone="neutral" /> : null}
          {event.registrationOpen && isFull ? <Pill label="Full" tone="danger" /> : null}
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  headerTitle: { ...typography.title, color: colors.text },
  headerSubtitle: { ...typography.caption, color: colors.textMuted, lineHeight: 19 },

  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  segmentActive: { backgroundColor: colors.surface },
  segmentLabel: { ...typography.bodyStrong, color: colors.textMuted },
  segmentLabelActive: { color: colors.brand },

  list: { gap: spacing.lg },
  count: { ...typography.caption, color: colors.textFaint },

  card: { padding: 0, overflow: 'hidden' },
  cover: {
    height: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  dateChip: {
    width: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dateDay: { ...typography.title, color: colors.brand },
  dateMonth: { ...typography.tiny, color: colors.textMuted },

  cardBody: { padding: spacing.lg, gap: spacing.sm },
  cardTitle: { ...typography.heading, color: colors.text },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { ...typography.caption, color: colors.textMuted, flex: 1 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  feeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTint,
  },
  feeText: { ...typography.tiny, color: colors.brand },
})
