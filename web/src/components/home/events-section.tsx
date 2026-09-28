import Link from 'next/link'
import { ArrowRight, CalendarDays, Megaphone } from 'lucide-react'

import type { Event, Paginated } from '@sfgc/shared'
import { api, safeFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { EventCard } from '@/components/events/event-card'
import { Reveal } from '@/components/motion/reveal'

const EMPTY_PAGE: Paginated<Event> = {
  items: [],
  meta: { page: 1, limit: 6, total: 0, totalPages: 1 },
}

export async function EventsSection() {
  const { items } = await safeFetch<Paginated<Event>>(
    () => api.events.list({ upcoming: true, limit: 6 }),
    EMPTY_PAGE,
    'events.list (home)',
  )

  return (
    <section aria-labelledby="events-heading" className="section bg-secondary/40">
      <div className="container">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="eyebrow">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              On campus
            </span>
            <h2 id="events-heading" className="heading-lg">
              Fests, seminars and workshops — open for registration
            </h2>
            <p className="lede">
              Every event below is live from the college calendar. Dates, venues and seat
              counts update the moment the office publishes a change.
            </p>
          </div>

          <Button asChild variant="outline" className="self-start md:self-end">
            <Link href="/events">
              View all events
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </Reveal>

        {items.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 6).map((event, index) => (
              <Reveal
                key={event.id}
                className="h-full"
                delay={Math.min(index, 3) * 0.08}
                amount={0.15}
              >
                <EventCard event={event} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-12">
            <div className="rounded-2xl border border-dashed border-primary/25 bg-card px-6 py-14 text-center shadow-card">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary dark:text-primary-200">
                <CalendarDays className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">
                No events are scheduled right now
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                The next fest, seminar and workshop dates are still being confirmed. Every
                announcement is published to the notices feed first, so that is the place to
                watch.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button asChild>
                  <Link href="/notices">
                    <Megaphone aria-hidden="true" />
                    Read the notices
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/events">Browse past events</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}
