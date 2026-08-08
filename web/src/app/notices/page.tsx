import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  ChevronRight,
  Megaphone,
  Search,
  SearchX,
  Smartphone,
} from 'lucide-react'

import type { Notice, Paginated } from '@sfgc/shared'
import { COLLEGE } from '@/content/college'
import { api, safeFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NoticeCard } from '@/components/notices/notice-card'
import { Reveal } from '@/components/motion/reveal'
import { cn } from '@/lib/utils'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Notices',
  description: `Official notices and circulars from ${COLLEGE.name}, ${COLLEGE.location} — examination schedules, holidays, placement drives and college announcements.`,
  alternates: { canonical: '/notices' },
  openGraph: {
    title: `Notices · ${COLLEGE.short}`,
    description: `The official notice board of ${COLLEGE.name} — exam schedules, holidays, placement drives and circulars, published by the college office.`,
  },
}

type SearchParams = { [key: string]: string | string[] | undefined }

const PAGE_SIZE = 12

/**
 * The categories the office publishes under. This mirrors the colour map in
 * `notice-card.tsx`; a category outside this list still renders correctly, it
 * simply has no pill of its own.
 */
const CATEGORIES = ['General', 'Exam', 'Event', 'Holiday', 'Placement'] as const

const EMPTY_PAGE: Paginated<Notice> = {
  items: [],
  meta: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 },
}

/** Query strings can repeat a key; take the first value and ignore the rest. */
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function hrefFor(params: {
  category?: string
  q?: string
  page?: number
}): string {
  const search = new URLSearchParams()
  if (params.category) search.set('category', params.category)
  if (params.q) search.set('q', params.q)
  // Page 1 is the default, so it never needs to appear in the URL.
  if (params.page && params.page > 1) search.set('page', String(params.page))
  const qs = search.toString()
  return qs ? `/notices?${qs}` : '/notices'
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

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const rawCategory = firstParam(searchParams.category)?.trim()
  // Passed through rather than validated against CATEGORIES, so a deep link to
  // a category the office adds later still filters correctly.
  const category = rawCategory ? rawCategory : undefined

  const rawQuery = firstParam(searchParams.q)?.trim()
  const q = rawQuery ? rawQuery : undefined

  const page = parsePage(firstParam(searchParams.page))

  const { items, meta } = await safeFetch<Paginated<Notice>>(
    () => api.notices.list({ category, q, page, limit: PAGE_SIZE }),
    EMPTY_PAGE,
    'notices.list',
  )

  const totalPages = Math.max(1, meta.totalPages)
  const total = meta.total
  const filtered = Boolean(category || q)

  const countLabel =
    total === 0
      ? 'No notices found'
      : `${total} notice${total === 1 ? '' : 's'}` +
        (category ? ` in ${category}` : '') +
        (q ? ` matching “${q}”` : '')

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
                Notices
              </li>
            </ol>
          </nav>

          <div className="mt-8 max-w-3xl">
            <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200 dark:text-gold-200">
              <Megaphone className="size-3.5" aria-hidden="true" />
              Official announcements
            </span>
            <h1 className="heading-xl mt-5">The {COLLEGE.short} notice board</h1>
            <p className="lede mt-5 text-white/80">
              Examination schedules, holidays, fee dates, placement drives and college
              circulars — published by the office, in one place. This feed is the official
              channel, and students receive the same notices in the SFGC Student app.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
            <section aria-labelledby="notices-listing-heading">
              <h2 id="notices-listing-heading" className="sr-only">
                All notices
              </h2>

              <div className="flex flex-col gap-6 border-b pb-8">
                {/* A plain GET form: filtering keeps working with no JavaScript. */}
                <form
                  action="/notices"
                  method="get"
                  role="search"
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  {category ? (
                    <input type="hidden" name="category" value={category} />
                  ) : null}

                  <div className="relative flex-1">
                    <label htmlFor="notice-search" className="sr-only">
                      Search notices
                    </label>
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="notice-search"
                      name="q"
                      type="search"
                      defaultValue={q ?? ''}
                      placeholder="Search notices by title or wording"
                      className="pl-11"
                    />
                  </div>

                  <Button type="submit" className="sm:w-auto">
                    Search
                  </Button>
                </form>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Category
                  </span>
                  <Pill href={hrefFor({ q })} active={!category}>
                    All
                  </Pill>
                  {CATEGORIES.map((name) => (
                    <Pill
                      key={name}
                      href={hrefFor({ category: name, q })}
                      active={category?.toLowerCase() === name.toLowerCase()}
                    >
                      {name}
                    </Pill>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{countLabel}</p>
                  {filtered ? (
                    <Link
                      href="/notices"
                      className="link-underline text-sm font-semibold text-primary
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                                 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                                 dark:text-primary-200"
                    >
                      Clear filters
                    </Link>
                  ) : null}
                </div>
              </div>

              {items.length > 0 ? (
                <Reveal className="mt-10" amount={0.05}>
                  <ol className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
                    {items.map((notice) => (
                      <li key={notice.id}>
                        <NoticeCard notice={notice} />
                      </li>
                    ))}
                  </ol>
                </Reveal>
              ) : (
                <Reveal className="mt-10">
                  <div className="rounded-2xl border border-dashed border-primary/25 bg-card px-6 py-16 text-center shadow-card">
                    <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary dark:text-primary-200">
                      {filtered ? (
                        <SearchX className="size-6" aria-hidden="true" />
                      ) : (
                        <BellRing className="size-6" aria-hidden="true" />
                      )}
                    </span>

                    <h3 className="mt-5 font-display text-xl font-semibold">
                      {q
                        ? `Nothing matches “${q}”`
                        : category
                          ? `No notices under ${category} right now`
                          : 'No notices are live at the moment'}
                    </h3>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                      {filtered
                        ? 'Notices are removed from the feed once they expire, so older circulars will not appear here. Try a different category, or clear the filters to see everything currently published.'
                        : 'Nothing has been published recently, and expired notices are removed automatically. New announcements appear here the moment the college office posts them.'}
                    </p>

                    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                      {filtered ? (
                        <Button asChild>
                          <Link href="/notices">Show all notices</Link>
                        </Button>
                      ) : null}
                      {!filtered && page > 1 ? (
                        <Button asChild>
                          <Link href="/notices">
                            <ArrowLeft aria-hidden="true" />
                            Back to the first page
                          </Link>
                        </Button>
                      ) : null}
                      <Button asChild variant="outline">
                        <Link href="/events">
                          Browse upcoming events
                          <ArrowRight aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Reveal>
              )}

              {totalPages > 1 ? (
                <nav
                  aria-label="Notices pagination"
                  className="mt-10 flex items-center justify-between gap-4 border-t pt-6"
                >
                  {page > 1 ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={hrefFor({ category, q, page: page - 1 })} rel="prev">
                        <ArrowLeft aria-hidden="true" />
                        Previous
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      Previous
                    </span>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Page {Math.min(page, totalPages)} of {totalPages}
                  </p>

                  {page < totalPages ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={hrefFor({ category, q, page: page + 1 })} rel="next">
                        Next
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      Next
                    </span>
                  )}
                </nav>
              ) : null}
            </section>

            <aside
              aria-labelledby="notice-audience-heading"
              className="lg:sticky lg:top-28 lg:self-start"
            >
              <div className="rounded-2xl border bg-card p-6 shadow-card">
                <h2
                  id="notice-audience-heading"
                  className="font-display text-lg font-semibold"
                >
                  Who sees which notice
                </h2>

                <dl className="mt-5 space-y-5 text-sm leading-relaxed">
                  <div>
                    <dt className="font-semibold text-foreground">Anyone visiting this page</dt>
                    <dd className="mt-1 text-muted-foreground">
                      You are reading the notices addressed to everyone — admission dates,
                      public holidays, results announcements and campus-wide circulars. No
                      sign-in needed.
                    </dd>
                  </div>

                  <div>
                    <dt className="font-semibold text-foreground">
                      Students, in the SFGC Student app
                    </dt>
                    <dd className="mt-1 text-muted-foreground">
                      Signed-in students also see the notices meant only for their own
                      programme and semester. An exam timetable for BCA Semester 3 reaches BCA
                      Semester 3 — and arrives as a push notification, not just a post.
                    </dd>
                  </div>

                  <div>
                    <dt className="font-semibold text-foreground">Teachers and staff</dt>
                    <dd className="mt-1 text-muted-foreground">
                      Staff circulars go to the SFGC Teacher app and are never published on the
                      public site.
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex items-start gap-3 rounded-xl bg-secondary/60 p-4">
                  <Smartphone
                    className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                    aria-hidden="true"
                  />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Every notice is written and approved by the college office. If something
                    matters, it is here — not in a group chat.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-gold/40 bg-gold-50/70 p-6 dark:border-gold/30 dark:bg-gold-950/30">
                <h3 className="font-display text-base font-semibold">
                  How this feed is ordered
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-gold-600 dark:marker:text-gold-400">
                  <li>Pinned notices stay at the top until the office unpins them.</li>
                  <li>Everything else runs newest first.</li>
                  <li>A notice with an expiry date leaves the feed on its own once it lapses.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
