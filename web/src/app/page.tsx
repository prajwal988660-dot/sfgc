import { Suspense } from 'react'
import type { Metadata } from 'next'

import { AboutSection } from '@/components/home/about-section'
import { AppDownloadSection } from '@/components/home/app-download-section'
import { CtaSection } from '@/components/home/cta-section'
import { DepartmentsSection } from '@/components/home/departments-section'
import { EventsSection } from '@/components/home/events-section'
import { GallerySection } from '@/components/home/gallery-section'
import { Hero } from '@/components/home/hero'
import { NoticesSection } from '@/components/home/notices-section'
import { PlacementsSection } from '@/components/home/placements-section'
import { StatsSection } from '@/components/home/stats-section'
import { Skeleton } from '@/components/ui/skeleton'
import { COLLEGE } from '@/content/college'

/**
 * The homepage reads live events and notices through `EventsSection` and
 * `NoticesSection`. Their fetches carry no cache hint, so Next 14 would treat
 * them as `force-cache` and — with no segment config here — prerender `/` once
 * at build time and never refresh it. Matching the 60s used by /events and
 * /notices keeps the two feeds on this page as live as the copy claims.
 */
export const revalidate = 60

export const metadata: Metadata = {
  // `absolute` opts out of the "%s · SFGC" template in the root layout — the
  // homepage title should carry the full institutional name on its own.
  title: { absolute: `${COLLEGE.name} — ${COLLEGE.tagline}` },
  description:
    `${COLLEGE.name} in ${COLLEGE.location} — ${COLLEGE.accreditation}, ${COLLEGE.iso}. ` +
    'Undergraduate and postgraduate programmes in commerce, management, computer ' +
    'applications and science, with campus placements, hostels and a 3.5-acre campus.',
  alternates: { canonical: '/' },
  openGraph: {
    url: '/',
    title: `${COLLEGE.name} — ${COLLEGE.tagline}`,
    description: `${COLLEGE.accreditation} · ${COLLEGE.affiliation}`,
  },
}

/*
 * Structured data for the knowledge panel. Every value is read from COLLEGE so
 * a correction in the content file flows through to search results too.
 *
 * The final address line ("Bengaluru — 560 064, Karnataka, India") holds the
 * locality, PIN, state and country in one human-readable string. schema.org
 * wants them apart, so it is split here rather than restated in content.
 */
const addressTail = COLLEGE.addressLines[COLLEGE.addressLines.length - 1]
const [cityWithPin = '', addressRegion = '', addressCountry = ''] = addressTail
  .split(',')
  .map((part) => part.trim())
const [addressLocality = '', postalCode = ''] = cityWithPin
  .split('—')
  .map((part) => part.trim())

const collegeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollegeOrUniversity',
  name: COLLEGE.name,
  alternateName: COLLEGE.short,
  url: COLLEGE.website,
  telephone: COLLEGE.phone,
  email: COLLEGE.email,
  foundingDate: String(COLLEGE.established),
  address: {
    '@type': 'PostalAddress',
    streetAddress: COLLEGE.addressLines.slice(1, -1).join(', '),
    addressLocality,
    postalCode: postalCode.replace(/\s+/g, ''),
    addressRegion,
    addressCountry,
  },
  sameAs: COLLEGE.socials.map((social) => social.href),
}

/* ------------------------------------------------------------ skeletons -- */

/** Three placeholder cards, keyed by name so no index keys are needed. */
const CARD_PLACEHOLDERS = ['first', 'second', 'third'] as const
const ROW_PLACEHOLDERS = ['first', 'second', 'third', 'fourth'] as const

function IntroSkeleton() {
  return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-7 w-36 rounded-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-5 w-11/12" />
      <Skeleton className="h-5 w-4/5" />
    </div>
  )
}

/** Mirrors the events grid, so the page does not jump when the data lands. */
function EventsSkeleton() {
  return (
    <div role="status" aria-label="Loading upcoming events" className="section">
      <div className="container" aria-hidden="true">
        <IntroSkeleton />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CARD_PLACEHOLDERS.map((key) => (
            <div key={key} className="overflow-hidden rounded-2xl border bg-card shadow-card">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="space-y-3 p-6">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-6 w-11/12" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="mt-2 h-10 w-32 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Mirrors the notices list. */
function NoticesSkeleton() {
  return (
    <div role="status" aria-label="Loading the latest notices" className="section">
      <div className="container" aria-hidden="true">
        <IntroSkeleton />

        <div className="mt-12 space-y-4">
          {ROW_PLACEHOLDERS.map((key) => (
            <div
              key={key}
              className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-card sm:flex-row sm:items-center"
            >
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-5 w-28 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- page -- */

/**
 * Section backgrounds alternate light / muted / navy down the page. The section
 * components paint their own translucent tint, so the wrappers here only set
 * the opaque ground underneath — that is what keeps two neighbouring bands from
 * landing on the same colour, without editing the sections themselves.
 */
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collegeJsonLd) }}
      />

      <Hero />

      <div className="bg-background">
        <AboutSection />
      </div>

      <StatsSection />

      <div className="bg-background">
        <DepartmentsSection />
      </div>

      <div className="bg-secondary/70">
        <Suspense fallback={<EventsSkeleton />}>
          <EventsSection />
        </Suspense>
      </div>

      <div className="bg-background">
        <Suspense fallback={<NoticesSkeleton />}>
          <NoticesSection />
        </Suspense>
      </div>

      <div className="bg-secondary/70">
        <PlacementsSection />
      </div>

      {/* The hairline keeps the gallery band legible against the placements
          band above it, where the tonal step is deliberately small. */}
      <div className="border-t border-border/60 bg-background">
        <GallerySection />
      </div>

      <div className="border-t border-border/60 bg-secondary/40">
        <AppDownloadSection />
      </div>

      <CtaSection />
    </>
  )
}
