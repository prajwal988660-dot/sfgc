import Link from 'next/link'
import { ArrowRight, Clock, Lock, MapPin, Ticket, Users } from 'lucide-react'

import { formatDateTime, formatFee } from '@sfgc/shared'
import type { Event } from '@sfgc/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Cover bands are keyed off the category so "Fest" always looks like "Fest"
 * across the site, without the backend having to store a colour.
 */
const COVER_GRADIENTS: readonly string[] = [
  'from-primary-900 via-primary-800 to-primary-600',
  'from-maroon-900 via-maroon-800 to-maroon-600',
  'from-primary-950 via-primary-800 to-maroon-700',
  'from-maroon-950 via-maroon-800 to-primary-700',
  'from-primary-800 via-primary-700 to-gold-700',
  'from-primary-950 via-primary-700 to-primary-500',
]

function gradientFor(category: string): string {
  let hash = 0
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) % 1_000_003
  }
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length]
}

/** Milliseconds at which the event is over — falls back to its start. */
function endMs(event: Event): number {
  const end = Date.parse(event.endsAt ?? event.startsAt)
  return Number.isNaN(end) ? Date.parse(event.startsAt) : end
}

export function EventCard({ event }: { event: Event }) {
  const start = new Date(event.startsAt)
  const validStart = !Number.isNaN(start.getTime())
  const day = validStart ? start.toLocaleDateString('en-IN', { day: '2-digit' }) : '--'
  const month = validStart
    ? start.toLocaleDateString('en-IN', { month: 'short' })
    : 'TBA'

  const finished = endMs(event) < Date.now()
  const hasCapacity = event.capacity !== null && event.seatsLeft !== null
  const soldOut = hasCapacity && (event.seatsLeft ?? 0) <= 0
  const closed = !event.registrationOpen || finished || soldOut

  const filled =
    event.capacity && event.capacity > 0
      ? Math.min(100, Math.round((event.registrationCount / event.capacity) * 100))
      : 0
  const scarce = hasCapacity && (event.seatsLeft ?? 0) <= Math.max(1, (event.capacity ?? 0) * 0.15)

  const action = closed ? 'View details' : 'Register'
  const closedReason = finished
    ? 'Event concluded'
    : soldOut
      ? 'Fully booked'
      : 'Registration closed'

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-within:-translate-y-1 focus-within:shadow-lift">
      {/* Cover band — colour is derived from the category, not stored per event. */}
      <div
        className={cn(
          'relative h-24 bg-gradient-to-br sm:h-28',
          gradientFor(event.category),
        )}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,.24),transparent_62%)]"
        />
        <div className="relative flex items-start justify-between gap-3 p-4">
          <Badge variant="glass" className="max-w-[60%] truncate">
            {event.category}
          </Badge>
          {closed ? (
            <Badge variant="glass" className="gap-1">
              <Lock className="size-3" aria-hidden="true" />
              {closedReason}
            </Badge>
          ) : null}
        </div>

        {/* Calendar chip straddles the band edge. */}
        <div className="absolute -bottom-7 left-6 flex w-16 flex-col items-center rounded-xl border bg-card px-2 py-2 text-center shadow-card">
          <span className="font-display text-2xl font-bold leading-none text-primary dark:text-primary-200">
            {day}
          </span>
          <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {month}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-10">
        <div className="space-y-2">
          <h3 className="line-clamp-2 font-display text-xl font-semibold leading-snug tracking-tight">
            {event.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex items-start gap-2.5">
            <dt className="sr-only">Date and time</dt>
            <Clock
              className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
              aria-hidden="true"
            />
            <dd className="text-muted-foreground">{formatDateTime(event.startsAt)}</dd>
          </div>

          {event.venue ? (
            <div className="flex items-start gap-2.5">
              <dt className="sr-only">Venue</dt>
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                aria-hidden="true"
              />
              <dd className="line-clamp-1 text-muted-foreground">{event.venue}</dd>
            </div>
          ) : null}

          <div className="flex items-start gap-2.5">
            <dt className="sr-only">Registration fee</dt>
            <Ticket
              className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
              aria-hidden="true"
            />
            <dd className="font-semibold text-foreground">{formatFee(event.fee)}</dd>
          </div>

          {hasCapacity ? (
            <div className="flex items-start gap-2.5">
              <dt className="sr-only">Seats</dt>
              <Users
                className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                aria-hidden="true"
              />
              <dd
                className={cn(
                  'text-muted-foreground',
                  scarce && !soldOut && 'font-semibold text-maroon-700 dark:text-maroon-300',
                )}
              >
                {soldOut
                  ? 'No seats remaining'
                  : `${event.seatsLeft} of ${event.capacity} seats left`}
              </dd>
            </div>
          ) : null}
        </dl>

        {hasCapacity ? (
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={filled}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Seats taken for ${event.title}`}
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500',
                soldOut || scarce ? 'bg-maroon' : 'bg-primary',
              )}
              style={{ width: `${Math.max(filled, 2)}%` }}
            />
          </div>
        ) : null}

        <div className="mt-auto pt-1">
          <Button
            asChild
            size="sm"
            variant={closed ? 'outline' : 'default'}
            className="w-full sm:w-auto"
          >
            <Link
              href={`/events/${event.slug}`}
              aria-label={`${action} — ${event.title}`}
            >
              {/* Stretches the link across the whole card without adding a second tab stop. */}
              <span className="absolute inset-0" aria-hidden="true" />
              {action}
              <ArrowRight
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
