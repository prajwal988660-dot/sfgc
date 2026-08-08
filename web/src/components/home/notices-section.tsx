import Link from 'next/link'
import { ArrowRight, BellRing, Megaphone, Smartphone } from 'lucide-react'

import type { Notice, Paginated } from '@sfgc/shared'
import { api, safeFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { NoticeCard } from '@/components/notices/notice-card'
import { Reveal } from '@/components/motion/reveal'

const EMPTY_PAGE: Paginated<Notice> = {
  items: [],
  meta: { page: 1, limit: 5, total: 0, totalPages: 1 },
}

export async function NoticesSection() {
  const { items } = await safeFetch<Paginated<Notice>>(
    () => api.notices.list({ limit: 5 }),
    EMPTY_PAGE,
    'notices.list (home)',
  )

  return (
    <section aria-labelledby="notices-heading" className="section">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-16">
          {/* Sticky lives on the grid item, not on the animated element. */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <span className="eyebrow">
                <Megaphone className="size-3.5" aria-hidden="true" />
                Notice board
              </span>

              <h2 id="notices-heading" className="heading-lg mt-5">
                Announcements, straight from the college office
              </h2>

              <p className="lede mt-5">
                This feed is the official channel for college announcements. Examination
                schedules, holidays, placement drives and circulars are published here first,
                so nothing important depends on a message forwarded through a group chat.
              </p>

              <div className="mt-6 flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card">
                <Smartphone
                  className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Students signed in to the{' '}
                  <strong className="font-semibold text-foreground">SFGC Student</strong> app
                  get the same notices pushed to their phone the moment they go out — including
                  the ones addressed only to their programme and semester.
                </p>
              </div>

              <Button asChild variant="outline" className="mt-7">
                <Link href="/notices">
                  View all notices
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </Reveal>
          </div>

          <Reveal delay={0.08} amount={0.1}>
            {items.length > 0 ? (
              <>
                {/* Ordered: the API returns pinned first, then newest. */}
                <ol className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
                  {items.map((notice) => (
                    <li key={notice.id}>
                      <NoticeCard notice={notice} />
                    </li>
                  ))}
                </ol>

                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Pinned notices stay at the top. Notices with an expiry date come off the feed
                  on their own once they lapse.
                </p>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-primary/25 bg-card px-6 py-14 text-center shadow-card">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary dark:text-primary-200">
                  <BellRing className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">
                  No notices are live at the moment
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Nothing has been published recently, and notices that have expired are
                  removed automatically. New announcements appear here the moment the office
                  posts them.
                </p>
                <Button asChild className="mt-7">
                  <Link href="/notices">
                    Open the notice board
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
