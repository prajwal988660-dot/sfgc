import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ChevronRight, Megaphone } from 'lucide-react'

import type { Event, Paginated } from '@sfgc/shared'
import { COLLEGE } from '@/content/college'
import { api, safeFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { EventCard } from '@/components/events/event-card'
import { Reveal } from '@/components/motion/reveal'
import { cn } from '@/lib/utils'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Events',
  description: `Fests, seminars, workshops and cultural programmes at ${COLLEGE.name}, ${COLLEGE.location}. Browse upcoming events and register online.`,
  alternates: { canonical: '/events' },
  openGraph: {
    title: `Events · ${COLLEGE.short}`,
    description: `What is happening on campus at ${COLLEGE.name} — fests, seminars, workshops and guest lectures.`,
  },
}

type SearchParams = { [key: string]: string | string[] | undefined }
type Filter = 'upcoming' | 'past'

const EMPTY_PAGE: Paginated<Event> = {
  items: [],
  meta: { page: 1, limit: 24, total: 0, totalPages: 1 },
}

/** Query strings can repeat a key; take the first value and ignore the rest. */
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function hrefFor(filter: Filter, category?: string): string {
  const params = new URLSearchParams()
  if (filter === 'past') params.set('filter', 'past')
  if (category) params.set('category', category)
  const qs = params.toString()
  return qs ? `/events?${qs}` : '/events'
}

function Pill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'border-transparent bg-primary text-primary-foreground shadow-card'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </Link>
  )
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const filter: Filter = firstParam(searchParams.filter) === 'past' ? 'past' : 'upcoming'
  const rawCategory = firstParam(searchParams.category)?.trim()
  const category = rawCategory ? rawCategory : undefined
  // Only the active flag is sent — the API treats a literal `upcoming=false` as
  // a filter in its own right.
  const scope: { upcoming?: boolean; past?: boolean } =
    filter === 'past' ? { past: true } : { upcoming: true }

  // Two reads: the filtered grid, and an unfiltered slice used only to discover
  // which categories exist — otherwise the pill row collapses to the one you
  // already picked and there is no way back.
  const [listing, catalogue] = await Promise.all([
    safeFetch<Paginated<Event>>(
      () => api.events.list({ ...scope, category, limit: 24 }),
      EMPTY_PAGE,
      `events.list (${filter})`,
    ),
    safeFetch<Paginated<Event>>(
      () => api.events.list({ ...scope, limit: 60 }),
      EMPTY_PAGE,
      'events.categories',
    ),
  ])

  const events = listing.items
  const categories = Array.from(
    new Set(catalogue.items.map((event) => event.category).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b))

  const total = listing.meta.total || events.length
  const countLabel =
    total === 0
      ? `No ${filter} events`
      : `${total} ${filter} event${total === 1 ? '' : 's'}${category ? ` in ${category}` : ''}`

  return (
    <>
      <section className="relative overflow-hidden bg-primary-950 pb-16 pt-28 text-white md:pb-20 md:pt-36">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_0%,rgba(42,99,184,.45),transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_100%_100%,rgba(138,31,64,.4),transparent_60%)]"
        />

        <div className="container relative">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-white/70">
              <li>
                <Link href="/" className="transition-colors hover:text-gold-200">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-4" />
              </li>
              <li className="font-semibold text-white" aria-current="page">
                Events
              </li>
            </ol>
          </nav>

          <div className="mt-8 max-w-3xl">
            <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200 dark:text-gold-200">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              College calendar
            </span>
            <h1 className="heading-xl mt-5">Events at {COLLEGE.short}</h1>
            <p className="lede mt-5 text-white/80">
              Inter-collegiate fests, departmental seminars, workshops and guest lectures —
              published straight from the college office. Registration for most events is
              open to students from any institution.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="events-listing-heading">
        <div className="container">
          <h2 id="events-listing-heading" className="sr-only">
            {filter === 'past' ? 'Past events' : 'Upcoming events'}
          </h2>

          <div className="flex flex-col gap-6 border-b pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <Pill href={hrefFor('upcoming', category)} active={filter === 'upcoming'}>
                Upcoming
              </Pill>
              <Pill href={hrefFor('past', category)} active={filter === 'past'}>
                Past events
              </Pill>
            </div>

            {categories.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Category
                </span>
                <Pill href={hrefFor(filter)} active={!category}>
                  All
                </Pill>
                {categories.map((name) => (
                  <Pill
                    key={name}
                    href={hrefFor(filter, name)}
                    active={category === name}
                  >
                    {name}
                  </Pill>
                ))}
              </div>
            ) : null}

            <p className="text-sm text-muted-foreground">{countLabel}</p>
          </div>

          {events.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event, index) => (
                <Reveal
                  key={event.id}
                  className="h-full"
                  delay={Math.min(index % 3, 2) * 0.08}
                  amount={0.15}
                >
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="mt-12">
              <div className="rounded-2xl border border-dashed border-primary/25 bg-card px-6 py-16 text-center shadow-card">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary dark:text-primary-200">
                  <CalendarDays className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">
                  {category
                    ? `Nothing ${filter === 'past' ? 'recorded' : 'scheduled'} under ${category}`
                    : filter === 'past'
                      ? 'No past events are listed yet'
                      : 'No events are scheduled right now'}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {filter === 'past'
                    ? 'Completed events stay on this page once they have taken place. Until then, look at what is coming up.'
                    : 'Dates for the next fests, seminars and workshops are still being confirmed. Announcements appear in the notices feed as soon as they are approved.'}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  {category ? (
                    <Button asChild>
                      <Link href={hrefFor(filter)}>Show all categories</Link>
                    </Button>
                  ) : null}
                  <Button asChild variant={category ? 'outline' : 'default'}>
                    <Link href={hrefFor(filter === 'past' ? 'upcoming' : 'past')}>
                      {filter === 'past' ? 'See upcoming events' : 'See past events'}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/notices">
                      <Megaphone aria-hidden="true" />
                      Read the notices
                    </Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  )
}
