import {
  Building2,
  Dumbbell,
  FlaskConical,
  HeartPulse,
  Library,
  Mic2,
  Presentation,
  Theater,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import type { GalleryImage } from '@sfgc/shared'
import { api, safeFetch } from '@/lib/api'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { COLLEGE, FACILITIES } from '@/content/college'
import { cn } from '@/lib/utils'

type FacilityName = (typeof FACILITIES)[number]['name']
type FacilityIconName = (typeof FACILITIES)[number]['icon']

/** Explicit map — keyed on the literal union so a new facility icon fails the build. */
const FACILITY_ICONS: Record<FacilityIconName, LucideIcon> = {
  Presentation,
  Library,
  Theater,
  Mic2,
  FlaskConical,
  Dumbbell,
  UtensilsCrossed,
  Building2,
  HeartPulse,
}

/**
 * Bento layout. The nine tiles pack a 4x4 grid exactly at `lg` (2+2 / 1+1 /
 * 1+1+2 / 1+2 around two multi-cell tiles), and a 2-column grid exactly at `sm`
 * because the last tile widens to fill the trailing row. Below `sm` everything
 * collapses to one full-width column, so no configuration can leave a hole.
 */
const TILES: Record<FacilityName, { span: string; gradient: string }> = {
  'Smart Classrooms': {
    span: 'lg:col-span-2 lg:row-span-2',
    gradient: 'from-primary-800 via-primary-900 to-primary-950',
  },
  'Central Library': {
    span: 'lg:col-span-2',
    gradient: 'from-maroon-800 via-maroon-900 to-primary-950',
  },
  Sabhangana: {
    span: '',
    gradient: 'from-primary-900 via-primary-800 to-maroon-800',
  },
  'Main Auditorium': {
    span: '',
    gradient: 'from-maroon-700 via-maroon-800 to-maroon-950',
  },
  Laboratories: {
    span: 'lg:row-span-2',
    gradient: 'from-primary-700 via-primary-800 to-primary-950',
  },
  'Multi Gym': {
    span: '',
    gradient: 'from-gold-800 via-gold-900 to-primary-950',
  },
  Canteen: {
    span: 'lg:col-span-2',
    gradient: 'from-primary-900 via-maroon-900 to-maroon-800',
  },
  'Halls of Residence': {
    span: '',
    gradient: 'from-primary-950 via-primary-900 to-primary-800',
  },
  'Wellness Centre': {
    span: 'sm:col-span-2',
    gradient: 'from-maroon-900 via-primary-900 to-gold-900',
  },
}

export async function GallerySection() {
  // The latest published photographs. Until staff upload some in the admin
  // panel this is empty and the strip is simply not rendered.
  const { items: photos } = await safeFetch(
    () => api.gallery.list({ limit: 8 }),
    { items: [] as GalleryImage[], meta: { page: 1, limit: 0, total: 0, totalPages: 1 } },
    'gallery.list (home)',
  )

  return (
    // No tint of its own: the placements band directly above already sits on
    // `bg-secondary`, and a second near-identical wash flattened the rhythm.
    <section aria-labelledby="gallery-heading" className="section">
      <div className="container">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">Campus</span>
          <h2 id="gallery-heading" className="heading-lg mt-5">
            Campus &amp; Facilities
          </h2>
          <p className="lede mt-5">
            {FACILITIES.length} facilities across the {COLLEGE.short} campus — rooms wired for
            teaching, laboratories for practical work, halls for the big occasions, and the everyday
            spaces in between.
          </p>
        </Reveal>

        <RevealGroup
          className="mt-12 grid auto-rows-[11.5rem] grid-cols-1 gap-4 sm:grid-cols-2
                     sm:auto-rows-[12.5rem] lg:grid-cols-4 lg:auto-rows-[13.5rem]"
          stagger={0.07}
        >
          {FACILITIES.map((facility) => {
            const Icon = FACILITY_ICONS[facility.icon]
            const tile = TILES[facility.name]

            return (
              <RevealItem key={facility.name} className={cn('min-w-0', tile.span)}>
                <article
                  className={cn(
                    'group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl',
                    'bg-gradient-to-br p-5 text-white shadow-card ring-1 ring-inset ring-white/10',
                    'sm:p-6',
                    tile.gradient,
                  )}
                >
                  <Icon
                    className="pointer-events-none absolute -right-6 -top-5 h-32 w-32 text-white/[0.12]
                               sm:-right-7 sm:-top-6 sm:h-40 sm:w-40"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />

                  {/* Darkens the foot of the tile so the caption keeps its contrast. */}
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45
                               via-black/10 to-transparent"
                    aria-hidden="true"
                  />

                  <div className="relative">
                    <h3 className="font-display text-lg font-semibold leading-snug sm:text-xl">
                      {facility.name}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/85">{facility.blurb}</p>
                  </div>
                </article>
              </RevealItem>
            )
          })}
        </RevealGroup>

        {photos.length > 0 ? (
          <div className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h3 className="font-display text-2xl font-bold">From the photo gallery</h3>
              <Button asChild variant="outline">
                <Link href="/gallery">
                  View gallery
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {photos.map((photo) => (
                <li key={photo.id}>
                  <figure className="overflow-hidden rounded-lg border border-border bg-card">
                    {/* Plain img: uploads can live on any host (see /gallery). */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageUrl}
                      alt={photo.altText ?? ''}
                      className="aspect-[4/3] w-full bg-muted object-cover"
                      loading="lazy"
                    />
                    <figcaption className="truncate px-3 py-2 text-xs text-muted-foreground">
                      {photo.title}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
