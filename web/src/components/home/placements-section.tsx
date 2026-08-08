import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  IndianRupee,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

import { CountUp } from '@/components/motion/count-up'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PLACEMENT_STATS, RECRUITERS } from '@/content/college'
import { cn } from '@/lib/utils'

/**
 * Icons run parallel to the order of PLACEMENT_STATS. The lookup falls back
 * rather than keying off the label, so an editorial change in college.ts can
 * never break the build.
 */
const STAT_ICONS: readonly LucideIcon[] = [
  TrendingUp,
  Building2,
  IndianRupee,
  CalendarCheck,
]

/** One pill, shared by the scrolling track and the reduced-motion fallback. */
const CHIP =
  'inline-flex items-center whitespace-nowrap rounded-full border border-border bg-card ' +
  'px-5 py-2.5 text-sm font-semibold text-primary-800 shadow-card dark:text-primary-100'

/**
 * A single pass of the recruiter list. The track holds two of these; the
 * second is a visual duplicate, hidden from assistive technology. Spacing
 * lives on each item as a right margin (not a flex gap) so the two passes are
 * exactly equal in width and the -50% translation loops without a seam.
 */
function MarqueeRow({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={duplicate || undefined}>
      {RECRUITERS.map((name) => (
        <li key={name} className="mr-3 shrink-0">
          <span className={CHIP}>{name}</span>
        </li>
      ))}
    </ul>
  )
}

export function PlacementsSection() {
  return (
    <section id="placements" className="section bg-secondary/40">
      <div className="container">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">Careers</span>
          <h2 className="heading-lg mt-5">Where a degree proves itself</h2>
          <p className="lede mt-5">
            Placement at SFGC is not a final-semester scramble. Training, drives, internships
            and mentoring run alongside the curriculum, so students meet recruiters already
            prepared for the room.
          </p>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLACEMENT_STATS.map((stat, index) => {
            const Icon = STAT_ICONS[index] ?? TrendingUp
            // The placement rate leads; gold is spent on exactly one number here.
            const isLead = index === 0

            return (
              <RevealItem key={stat.label}>
                <Card
                  className={cn(
                    'h-full transition-shadow hover:shadow-lift',
                    isLead &&
                      'border-gold/40 bg-gradient-to-br from-gold-50 via-card to-card shadow-lift ' +
                        'dark:border-gold/30 dark:from-gold-950/60',
                  )}
                >
                  <CardContent className="flex h-full flex-col gap-4 p-6 sm:p-7">
                    <span
                      className={cn(
                        'inline-flex h-11 w-11 items-center justify-center rounded-xl',
                        isLead
                          ? 'bg-gold/15 text-gold-700 dark:text-gold-300'
                          : 'bg-primary/10 text-primary dark:text-primary-200',
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <p
                      className={cn(
                        'font-display text-4xl font-bold leading-none tabular-nums sm:text-5xl',
                        isLead
                          ? 'text-gold-700 dark:text-gold-300'
                          : 'text-primary-800 dark:text-primary-200',
                      )}
                    >
                      <CountUp
                        value={stat.value}
                        suffix={stat.suffix}
                        decimals={stat.decimals}
                      />
                    </p>

                    <p className="mt-auto text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </div>

      <div className="container mt-16">
        <Reveal className="text-center">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recruiters on campus
          </h3>
        </Reveal>
      </div>

      {/* Full-bleed strip: the fade at both edges only reads as a loop edge-to-edge. */}
      <div className="group relative mt-6 overflow-hidden py-2 mask-fade-x motion-reduce:hidden">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          <MarqueeRow />
          <MarqueeRow duplicate />
        </div>
      </div>

      {/* Reduced motion: the same names, wrapped and still. */}
      <div className="container mt-6 hidden motion-reduce:block">
        <ul className="flex flex-wrap justify-center gap-3">
          {RECRUITERS.map((name) => (
            <li key={name}>
              <span className={CHIP}>{name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="container">
        <Reveal className="mx-auto mt-16 max-w-4xl rounded-2xl border bg-card p-8 shadow-card sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h3 className="font-display text-xl font-semibold">
                The Career &amp; Placement Cell
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                The cell works with students from the second year onward — aptitude and
                communication training built into the week, internships and live projects with
                partner organisations, pre-placement talks, and recruitment drives held on
                campus through the year. Commerce, management, computer applications and
                science students are all supported through the same process.
              </p>
            </div>

            <Button asChild size="lg" className="shrink-0 self-start lg:self-auto">
              <Link href="/placements">
                Explore placements
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
