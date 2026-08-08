import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Platform, StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import type { Event } from '@sfgc/shared'
import { formatDateTime, formatFee } from '@sfgc/shared'

import {
  AppButton,
  Card,
  Divider,
  ErrorState,
  KeyValue,
  LoadingState,
  Pill,
  Screen,
  SectionTitle,
  StatTile,
} from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { gradientForCategory } from '@/screens/EventsScreen'
import { useAuth } from '@/store/auth'
import type { RootStackParamList } from '@/navigation/types'
import { colors, radius, spacing, typography } from '@/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>

export default function EventDetailScreen({ route, navigation }: Props) {
  const { eventId, title } = route.params
  const { user } = useAuth()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [registering, setRegistering] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [ticketCode, setTicketCode] = useState<string | null>(null)

  // The register handler lives outside the fetch effect, so it needs its own
  // mounted guard rather than that effect's cancelled flag.
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const heading = title ?? event?.title
    if (heading) navigation.setOptions({ title: heading })
  }, [navigation, title, event?.title])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const result = await api.events.get(eventId)
        if (cancelled) return
        setEvent(result)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(errorMessage(err))
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
  }, [eventId, reloadKey])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
    setLoading(true)
    setReloadKey((key) => key + 1)
  }, [])

  const handleRegister = useCallback(async () => {
    if (!event || !user) return
    setRegistering(true)
    setRegisterError(null)
    try {
      const result = await api.events.register(event.id, {
        name: user.name,
        email: user.email,
        phone: user.phone ?? undefined,
      })
      if (!mounted.current) return
      setTicketCode(result.ticketCode)
      // Refetch so isRegistered and seatsLeft reflect the new registration.
      setReloadKey((key) => key + 1)
    } catch (err) {
      if (!mounted.current) return
      if (err instanceof ApiError && err.code === 'CONFLICT') {
        setRegisterError(
          'You are already registered for this event — one registration per email address.',
        )
        setReloadKey((key) => key + 1)
      } else {
        setRegisterError(errorMessage(err))
      }
    } finally {
      if (mounted.current) setRegistering(false)
    }
  }, [event, user])

  const copyTicket = useCallback(async () => {
    if (!ticketCode) return
    try {
      await Clipboard.setStringAsync(ticketCode)
      Alert.alert(
        'Copied',
        `Ticket code ${ticketCode} is on your clipboard. You will be asked for it at the registration desk.`,
        [{ text: 'Done' }],
      )
    } catch {
      // Clipboard access can be refused; the code itself is what matters, so
      // show it rather than reporting a failure the student cannot act on.
      Alert.alert(
        'Your ticket code',
        `${ticketCode}\n\nCopying was not available — please take a screenshot. You will be asked for this code at the registration desk.`,
        [{ text: 'Got it' }],
      )
    }
  }, [ticketCode])

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading event…" />
      </Screen>
    )
  }

  if (error || !event) {
    return (
      <Screen refreshing={refreshing} onRefresh={handleRefresh}>
        <ErrorState
          message={error ?? 'This event could not be loaded.'}
          onRetry={handleRetry}
        />
      </Screen>
    )
  }

  const endsMs = event.endsAt ? new Date(event.endsAt).getTime() : NaN
  const startsMs = new Date(event.startsAt).getTime()
  const finishedMs = Number.isNaN(endsMs) ? startsMs : endsMs
  const isPast = !Number.isNaN(finishedMs) && finishedMs < Date.now()
  const isFull = event.seatsLeft !== null && event.seatsLeft <= 0
  // A fresh ticket counts as registered even before the refetch lands.
  const registered = event.isRegistered === true || ticketCode !== null

  const blocked = isPast
    ? {
        icon: 'time-outline' as const,
        title: 'This event has ended',
        message:
          'Registrations closed when the event finished. Check the Upcoming tab for what is next.',
      }
    : !event.registrationOpen
      ? {
          icon: 'lock-closed-outline' as const,
          title: 'Registration is closed',
          message:
            'The organisers are no longer taking registrations for this event. Contact them directly if you think this is a mistake.',
        }
      : isFull
        ? {
            icon: 'people-outline' as const,
            title: 'All seats are taken',
            message:
              'Every seat has been filled. Contact the organiser to ask about a waiting list.',
          }
        : null

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentStyle={styles.content}
    >
      <LinearGradient
        colors={gradientForCategory(event.category)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Pill label={event.category} tone="neutral" />
        <Text style={styles.heroTitle}>{event.title}</Text>

        <View style={styles.heroRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textOnBrand} />
          <Text style={styles.heroText}>{formatDateTime(event.startsAt)}</Text>
        </View>
        <View style={styles.heroRow}>
          <Ionicons name="location-outline" size={16} color={colors.textOnBrand} />
          <Text style={styles.heroText}>
            {event.venue ?? 'Venue to be announced'}
          </Text>
        </View>
        <View style={styles.heroRow}>
          <Ionicons name="pricetag-outline" size={16} color={colors.textOnBrand} />
          <Text style={styles.heroText}>{formatFee(event.fee)}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.statRow}>
          <StatTile
            value={String(event.registrationCount)}
            label="Registered"
            tone="brand"
          />
          {event.seatsLeft !== null ? (
            <StatTile
              value={String(event.seatsLeft)}
              label="Seats left"
              tone={event.seatsLeft <= 0 ? 'danger' : event.seatsLeft < 20 ? 'warning' : 'success'}
            />
          ) : null}
        </View>

        {registered ? (
          <Card style={styles.successPanel}>
            <View style={styles.panelHeading}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.panelTitle}>You are registered</Text>
            </View>
            <Text style={styles.panelText}>
              {ticketCode
                ? 'Your seat is confirmed. Keep the ticket code below — you will be asked for it at the registration desk.'
                : `Your seat for this event is confirmed under ${user?.email ?? 'your college account'}.`}
            </Text>

            {ticketCode ? (
              <View style={styles.ticketBox}>
                <Text style={styles.ticketLabel}>Ticket code</Text>
                <Text style={styles.ticketCode} selectable>
                  {ticketCode}
                </Text>
                <AppButton
                  label="Copy"
                  icon="copy-outline"
                  onPress={copyTicket}
                  variant="outline"
                  small
                  fullWidth={false}
                />
              </View>
            ) : null}
          </Card>
        ) : blocked ? (
          <Card style={styles.blockedPanel}>
            <View style={styles.panelHeading}>
              <Ionicons name={blocked.icon} size={22} color={colors.textMuted} />
              <Text style={styles.panelTitle}>{blocked.title}</Text>
            </View>
            <Text style={styles.panelText}>{blocked.message}</Text>
          </Card>
        ) : user ? (
          <Card style={styles.registerPanel}>
            <Text style={styles.panelTitle}>Register for this event</Text>
            <Text style={styles.panelText}>
              We will register you as {user.name} ({user.email}
              {user.phone ? `, ${user.phone}` : ''}). You will get a ticket code to
              show at the desk.
            </Text>

            {registerError ? (
              <View style={styles.banner}>
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={colors.danger}
                  style={styles.bannerIcon}
                />
                <Text style={styles.bannerText}>{registerError}</Text>
              </View>
            ) : null}

            <AppButton
              label="Register for this event"
              icon="ticket-outline"
              onPress={() => void handleRegister()}
              loading={registering}
            />
          </Card>
        ) : null}

        <View style={styles.section}>
          <SectionTitle title="About this event" />
          <Text style={styles.description}>{event.description}</Text>
        </View>

        <Card style={styles.detailsCard}>
          <KeyValue label="Starts" value={formatDateTime(event.startsAt)} />
          {event.endsAt ? (
            <>
              <Divider />
              <KeyValue label="Ends" value={formatDateTime(event.endsAt)} />
            </>
          ) : null}
          {event.venue ? (
            <>
              <Divider />
              <KeyValue label="Venue" value={event.venue} />
            </>
          ) : null}
          {event.seatsLeft !== null ? (
            <>
              <Divider />
              <KeyValue
                label="Seats left"
                value={
                  event.capacity !== null
                    ? `${event.seatsLeft} of ${event.capacity}`
                    : String(event.seatsLeft)
                }
              />
            </>
          ) : null}
          {event.organizer ? (
            <>
              <Divider />
              <KeyValue label="Organiser" value={event.organizer} />
            </>
          ) : null}
          {event.contactName ? (
            <>
              <Divider />
              <KeyValue label="Contact" value={event.contactName} />
            </>
          ) : null}
          {event.contactEmail ? (
            <>
              <Divider />
              <KeyValue label="Contact email" value={event.contactEmail} />
            </>
          ) : null}
          {event.contactPhone ? (
            <>
              <Divider />
              <KeyValue label="Contact phone" value={event.contactPhone} />
            </>
          ) : null}
        </Card>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  // The hero bleeds to the screen edges, so the body owns its own padding.
  content: { padding: 0, paddingBottom: spacing.xxxl, gap: 0 },

  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    gap: spacing.sm,
  },
  heroTitle: { ...typography.display, color: colors.textOnBrand, marginTop: spacing.xs },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroText: { ...typography.body, color: 'rgba(255, 255, 255, 0.88)', flex: 1 },

  body: { padding: spacing.lg, gap: spacing.lg },

  statRow: { flexDirection: 'row', gap: spacing.md },

  panelHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  panelTitle: { ...typography.heading, color: colors.text, flex: 1 },
  panelText: { ...typography.body, color: colors.textMuted, lineHeight: 22 },

  successPanel: {
    gap: spacing.md,
    backgroundColor: colors.successTint,
    borderColor: colors.success,
  },
  blockedPanel: { gap: spacing.md, backgroundColor: colors.surfaceAlt },
  registerPanel: { gap: spacing.md },

  ticketBox: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.success,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  ticketLabel: { ...typography.tiny, color: colors.textFaint, textTransform: 'uppercase' },
  ticketCode: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.text,
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerTint,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  bannerIcon: { marginTop: 1 },
  bannerText: { ...typography.caption, color: colors.danger, flex: 1, lineHeight: 19 },

  section: { gap: spacing.sm },
  description: { ...typography.body, color: colors.text, lineHeight: 24 },

  detailsCard: { gap: spacing.md },
})
