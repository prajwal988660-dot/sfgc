'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  Landmark,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BADGES, COLLEGE, HERO_SLIDES } from '@/content/college'
import { cn } from '@/lib/utils'

type BadgeLabel = (typeof BADGES)[number]['label']

const BADGE_ICONS: Record<BadgeLabel, LucideIcon> = {
  'NAAC A+': Award,
  'UGC 2(f) & 12(B)': ShieldCheck,
  'ISO 9001:2015': BadgeCheck,
  'Est. 1930': Landmark,
}

/**
 * Homepage banner: the campus building behind a navy scrim, the college's name and
 * standing on the left, and the highlights on the right. Everything is visible
 * on first paint — nothing waits for an entrance animation — and the
 * highlights change only when the visitor picks one.
 */
export function Hero() {
  const [index, setIndex] = React.useState(0)
  const slide = HERO_SLIDES[index]

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-primary-950 text-white"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src="/campus-building.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_60%]"
        />
        {/* Scrim: solid enough on the left for the type, lighter on the right. */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950/95 via-primary-950/80 to-primary-950/55" />
      </div>

      <div className="container grid gap-10 py-14 sm:py-16 lg:grid-cols-12 lg:gap-12 lg:py-20">
        <div className="lg:col-span-7">
          <p className="eyebrow text-gold-200 dark:text-gold-200">
            {COLLEGE.tagline}
          </p>
          <h1
            id="hero-title"
            className="mt-5 text-[2.1rem] font-bold leading-[1.1] sm:text-5xl lg:text-[3.4rem]"
          >
            {COLLEGE.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {COLLEGE.affiliation}. A unit of {COLLEGE.trust}, {COLLEGE.location}.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="gold" size="lg" className="w-full sm:w-auto">
              <Link href="/admissions">
                Admissions 2026–27
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg" className="w-full sm:w-auto">
              <Link href="/events">
                <CalendarDays aria-hidden="true" />
                Upcoming Events
              </Link>
            </Button>
          </div>
        </div>

        {/* Highlights — the same content the old rotator carried. */}
        <aside
          aria-labelledby="hero-highlights"
          className="self-end rounded-lg border border-white/15 bg-primary-950/70 backdrop-blur-sm lg:col-span-5"
        >
          <div className="flex items-center justify-between border-b border-white/15 px-5 py-3">
            <h2
              id="hero-highlights"
              className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-gold-200"
            >
              Highlights
            </h2>
            <div role="group" aria-label="Choose a highlight" className="flex items-center gap-1">
              {HERO_SLIDES.map((entry, i) => {
                const active = i === index
                return (
                  <button
                    key={entry.tag}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={active ? 'true' : undefined}
                    aria-label={`Show highlight ${i + 1} of ${HERO_SLIDES.length}: ${entry.title}`}
                    className={cn(
                      'h-7 min-w-7 rounded-sm px-2 text-xs font-semibold transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                      active ? 'bg-gold text-gold-foreground' : 'text-white/70 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="px-5 py-5" aria-live="polite">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/60">
              {slide.tag}
            </p>
            <p className="mt-2 font-display text-xl font-semibold leading-snug sm:text-2xl">
              {slide.title}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/80">{slide.caption}</p>
          </div>
        </aside>
      </div>

      <p className="container pb-2 text-right text-[10px] text-white/50">Photo: Sham Robinson</p>

      {/* Credentials strip */}
      <div className="border-t border-white/15 bg-primary-950/80">
        <ul className="container grid grid-cols-2 gap-x-4 gap-y-4 py-4 md:grid-cols-4 md:py-5">
          {BADGES.map((entry) => {
            const Icon = BADGE_ICONS[entry.label]
            return (
              <li key={entry.label} className="flex items-center gap-3">
                <Icon className="size-5 shrink-0 text-gold-200" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight text-white">
                    {entry.label}
                  </span>
                  <span className="block text-[10px] uppercase leading-tight tracking-[0.16em] text-white/65">
                    {entry.detail}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
