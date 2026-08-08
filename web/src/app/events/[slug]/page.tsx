import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock,
  Lock,
  Mail,
  MapPin,
  Phone,
  Ticket,
  UserRound,
  Users,
} from 'lucide-react'

import { formatDate, formatDateTime, formatFee } from '@sfgc/shared'
import type { Event } from '@sfgc/shared'
import { COLLEGE } from '@/content/college'
import { api, ApiError } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RegisterForm } from '@/components/events/register-form'
import { Reveal } from '@/components/motion/reveal'

export const revalidate = 60

interface EventPageProps {
  params: { slug: string }
}

/**
 * Only a genuine 404 collapses to `notFound()`. Every other failure — the API
 * being down, a 500, a timeout — is rethrown so the error boundary handles it.
 *
 * Swallowing those would be actively harmful here: this segment is on ISR, so a
 * momentary outage would bake a permanent 404 into the cache for a real event,
 * and `generateMetadata` would mark the same URL `noindex` at the same time.
 */
async function loadEvent(slug: string): Promise<Event | null> {
  try {
    return await api.events.get(slug)
  } catch (error) {
    if (error instanceof ApiError && error.code === 'NOT_FOUND') return null
    throw error
  }
}

/** Trimmed to a length search engines will actually show. */
function summarise(description: string, limit = 155): string {
  const clean = description.replace(/\s+/g, ' ').trim()
  if (clean.length <= limit) return clean
  return `${clean.slice(0, limit - 1).trimEnd()}…`
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = await loadEvent(params.slug)

  if (!event) {
    return {
      title: 'Event not found',
      description: `This event is no longer listed on the ${COLLEGE.short} calendar.`,
      robots: { index: false, follow: true },
    }
  }

  const description = summarise(event.description)

  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      type: 'article',
      title: `${event.title} · ${COLLEGE.short}`,
      description,
      ...(event.coverImage ? { images: [{ url: event.coverImage }] } : {}),
    },
  }
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const event = await loadEvent(params.slug)
  if (!event) notFound()

  const endTime = Date.parse(event.endsAt ?? event.startsAt)
  const finished = !Number.isNaN(endTime) && endTime < Date.now()
  const hasCapacity = event.capacity !== null && event.seatsLeft !== null
  const soldOut = hasCapacity && (event.seatsLeft ?? 0) <= 0
  const closed = !event.registrationOpen || finished || soldOut

  const paragraphs = event.description
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  const hasContact = Boolean(
    event.organizer || event.contactName || event.contactEmail || event.contactPhone,
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: summarise(event.description, 300),
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue ?? COLLEGE.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'New Town, Yelahanka',
        addressLocality: 'Bengaluru',
        postalCode: '560064',
        addressRegion: 'Karnataka',
        addressCountry: 'IN',
      },
    },
    organizer: {
      '@type': 'CollegeOrUniversity',
      name: event.organizer ?? COLLEGE.name,
      url: COLLEGE.website,
    },
    offers: {
      '@type': 'Offer',
      price: event.fee,
      priceCurrency: 'INR',
      availability: soldOut
        ? 'https://schema.org/SoldOut'
        : closed
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      url: `${COLLEGE.website}events/${event.slug}`,
    },
  }

  return (
    <article>
      {/* Structured data — the "<" escape keeps a title containing markup from closing the tag. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <header className="relative overflow-hidden bg-primary-950 pb-16 pt-28 text-white md:pb-20 md:pt-36">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_0%,rgba(42,99,184,.45),transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_50%_55%_at_100%_100%,rgba(138,31,64,.42),transparent_60%)]"
        />

        <div className="container relative">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-white/70">
              <li>
                <Link href="/" className="transition-colors hover:text-gold-200">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-4" />
              </li>
              <li>
                <Link href="/events" className="transition-colors hover:text-gold-200">
                  Events
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-4" />
              </li>
              <li className="max-w-[16rem] truncate font-semibold text-white" aria-current="page">
                {event.title}
              </li>
            </ol>
          </nav>

          <div className="mt-8 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="glass">{event.category}</Badge>
              {finished ? (
                <Badge variant="glass" className="gap-1">
                  <Lock className="size-3" aria-hidden="true" />
                  Concluded
                </Badge>
              ) : soldOut ? (
                <Badge variant="glass" className="gap-1">
                  <Users className="size-3" aria-hidden="true" />
                  Fully booked
                </Badge>
              ) : event.registrationOpen ? (
                <Badge
                  variant="gold"
                  className="border-gold/40 bg-gold/20 text-gold-100 dark:text-gold-100"
                >
                  Registration open
                </Badge>
              ) : (
                <Badge variant="glass" className="gap-1">
                  <Lock className="size-3" aria-hidden="true" />
                  Registration closed
                </Badge>
              )}
            </div>

            <h1 className="heading-xl mt-5">{event.title}</h1>

            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm text-white/85">
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-gold-300" aria-hidden="true" />
                <span>{formatDateTime(event.startsAt)}</span>
              </li>
              {event.venue ? (
                <li className="flex items-center gap-2.5">
                  <MapPin className="size-4 shrink-0 text-gold-300" aria-hidden="true" />
                  <span>{event.venue}</span>
                </li>
              ) : null}
              <li className="flex items-center gap-2.5">
                <Ticket className="size-4 shrink-0 text-gold-300" aria-hidden="true" />
                <span className="font-semibold text-white">{formatFee(event.fee)}</span>
              </li>
              {hasCapacity && !soldOut ? (
                <li className="flex items-center gap-2.5">
                  <Users className="size-4 shrink-0 text-gold-300" aria-hidden="true" />
                  <span>{event.seatsLeft} seats left</span>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </header>

      <div className="section">
        <div className="container grid items-start gap-12 lg:grid-cols-3 lg:gap-16">
          <div className="lg:col-span-2">
            <Reveal>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                About this event
              </h2>
              <div className="mt-6 space-y-5">
                {paragraphs.length > 0 ? (
                  paragraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className="whitespace-pre-line text-base leading-relaxed text-muted-foreground sm:text-lg"
                    >
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                    Full details for this event will be published shortly. Contact the
                    college office at{' '}
                    <a
                      href={`mailto:${COLLEGE.email}`}
                      className="font-semibold text-primary link-underline dark:text-primary-200"
                    >
                      {COLLEGE.email}
                    </a>{' '}
                    in the meantime.
                  </p>
                )}
              </div>
            </Reveal>

            {hasContact ? (
              <Reveal className="mt-12">
                <Card className="bg-secondary/40">
                  <CardHeader>
                    <CardTitle className="text-lg">Organiser &amp; contact</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    {event.organizer ? (
                      <div className="flex items-start gap-3">
                        <Building2
                          className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Organised by
                          </p>
                          <p className="mt-1 font-semibold">{event.organizer}</p>
                        </div>
                      </div>
                    ) : null}

                    {event.contactName ? (
                      <div className="flex items-start gap-3">
                        <UserRound
                          className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Coordinator
                          </p>
                          <p className="mt-1 font-semibold">{event.contactName}</p>
                        </div>
                      </div>
                    ) : null}

                    {event.contactEmail ? (
                      <div className="flex items-start gap-3">
                        <Mail
                          className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Email
                          </p>
                          <a
                            href={`mailto:${event.contactEmail}`}
                            className="mt-1 inline-block font-semibold text-primary link-underline dark:text-primary-200"
                          >
                            {event.contactEmail}
                          </a>
                        </div>
                      </div>
                    ) : null}

                    {event.contactPhone ? (
                      <div className="flex items-start gap-3">
                        <Phone
                          className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Phone
                          </p>
                          <a
                            href={`tel:${event.contactPhone.replace(/[^\d+]/g, '')}`}
                            className="mt-1 inline-block font-semibold text-primary link-underline dark:text-primary-200"
                          >
                            {event.contactPhone}
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </Reveal>
            ) : null}

            <div className="mt-12">
              <Button asChild variant="ghost" className="-ml-4">
                <Link href="/events">
                  <ArrowLeft aria-hidden="true" />
                  Back to all events
                </Link>
              </Button>
            </div>
          </div>

          <aside className="space-y-6 self-start lg:sticky lg:top-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y text-sm">
                  <div className="flex items-start justify-between gap-4 py-3 first:pt-0">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                      Starts
                    </dt>
                    <dd className="text-right font-semibold">
                      {formatDateTime(event.startsAt)}
                    </dd>
                  </div>

                  {event.endsAt ? (
                    <div className="flex items-start justify-between gap-4 py-3">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4 shrink-0" aria-hidden="true" />
                        Ends
                      </dt>
                      <dd className="text-right font-semibold">
                        {formatDateTime(event.endsAt)}
                      </dd>
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      Venue
                    </dt>
                    <dd className="text-right font-semibold">
                      {event.venue ?? `${COLLEGE.short} campus, ${COLLEGE.location}`}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <Ticket className="size-4 shrink-0" aria-hidden="true" />
                      Fee
                    </dt>
                    <dd className="text-right font-semibold">{formatFee(event.fee)}</dd>
                  </div>

                  <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <Users className="size-4 shrink-0" aria-hidden="true" />
                      Registered
                    </dt>
                    <dd className="text-right font-semibold">
                      {hasCapacity
                        ? `${event.registrationCount} of ${event.capacity}`
                        : event.registrationCount}
                    </dd>
                  </div>
                </dl>

                {hasCapacity ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {soldOut
                      ? 'All seats for this event have been taken.'
                      : `${event.seatsLeft} seats still available.`}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {closed ? (
              <Card className="border-dashed bg-secondary/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lock
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {finished
                      ? 'This event has concluded'
                      : soldOut
                        ? 'Registration is full'
                        : 'Registration is closed'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    {finished
                      ? `It took place on ${formatDate(event.startsAt)}. Upcoming fests, seminars and workshops are listed on the events page.`
                      : soldOut
                        ? 'Every seat has been allotted. If a place opens up the office will announce it in the notices feed.'
                        : 'Online registration for this event is not accepting entries at the moment.'}
                  </p>
                  {event.contactEmail ? (
                    <p>
                      Questions? Write to{' '}
                      <a
                        href={`mailto:${event.contactEmail}`}
                        className="font-semibold text-primary link-underline dark:text-primary-200"
                      >
                        {event.contactEmail}
                      </a>
                      .
                    </p>
                  ) : null}
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/events">Browse upcoming events</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <RegisterForm event={event} />
            )}
          </aside>
        </div>
      </div>
    </article>
  )
}
