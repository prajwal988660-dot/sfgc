import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Award,
  Building2,
  ChevronRight,
  Compass,
  Eye,
  GraduationCap,
  Quote,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { CountUp } from '@/components/motion/count-up'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ACHIEVEMENTS,
  BADGES,
  COLLEGE,
  MISSION,
  PRINCIPAL,
  VISION,
  WELCOME,
} from '@/content/college'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'About the College',
  description:
    `${COLLEGE.name} — ${COLLEGE.affiliation}. Our vision and mission, the Principal’s ` +
    `message, recent achievements and the story of ${COLLEGE.trust}, which has taught in ` +
    'Bengaluru since 1930.',
  alternates: { canonical: '/about' },
  openGraph: {
    url: '/about',
    title: `About ${COLLEGE.name}`,
    description: `${COLLEGE.tagline} · ${COLLEGE.accreditation}`,
  },
}

const PILLARS: ReadonlyArray<{ title: string; body: string; icon: LucideIcon }> = [
  { title: 'Vision', body: VISION, icon: Eye },
  { title: 'Mission', body: MISSION, icon: Compass },
]

/** The facts a prospective student or parent checks first. */
const QUICK_FACTS: ReadonlyArray<{ term: string; detail: string }> = [
  { term: 'Established', detail: String(COLLEGE.established) },
  { term: 'Managed by', detail: COLLEGE.trust },
  { term: 'Affiliation', detail: COLLEGE.affiliation },
  { term: 'Accreditation', detail: COLLEGE.accreditation },
  { term: 'Certification', detail: COLLEGE.iso },
  { term: 'Campus', detail: `3.5 acres, ${COLLEGE.location}` },
]

/**
 * Page-scoped copy for the Trust section. Editorial content belongs in
 * `content/college.ts`; the Trust’s history has no home there yet, so it sits
 * here — move it across when that file next changes.
 */
const TRUST_STORY: readonly string[] = [
  'The story starts in 1930, when Smt. Anandamma and Smt. Seethamma began teaching about twenty children in two rooms in Seshadripuram. It was a neighbourhood act of service, run on conviction rather than capital, and it grew into one of the oldest education movements in Bengaluru.',
  'The Seshadripuram Educational Association was registered in 1944 to carry that work forward on a formal footing, and in 1980 the Association established the Seshadripuram Educational Trust to hold and grow the institutions in its care.',
  'Today the Trust runs roughly 24 institutions, from kindergarten through to postgraduate study, teaching around 20,000 students with the help of about 1,000 employees. Seshadripuram First Grade College is one of them — and it still answers to the same idea those two rooms were built on.',
]

const TRUST_STATS: ReadonlyArray<{
  value: number
  suffix: string
  label: string
  detail: string
  icon: LucideIcon
}> = [
  {
    value: 24,
    suffix: '',
    label: 'Institutions',
    detail: 'Kindergarten to postgraduate',
    icon: Building2,
  },
  {
    value: 20000,
    suffix: '+',
    label: 'Students',
    detail: 'Learning across the Trust today',
    icon: GraduationCap,
  },
  {
    value: 1000,
    suffix: '+',
    label: 'Employees',
    detail: 'Teaching and support staff',
    icon: Users,
  },
]

/**
 * "Dr. S. N. Venkatesh" → "SNV". The honorific is dropped first so the monogram
 * never starts with a D; initials come from what remains.
 */
const PRINCIPAL_INITIALS = PRINCIPAL.name
  .replace(/^(dr|prof|mr|mrs|ms|smt|shri)\.?\s+/i, '')
  .split(/\s+/)
  .map((part) => part.charAt(0))
  .join('')
  .toUpperCase()

export default function AboutPage() {
  return (
    <>
      {/* ---------------------------------------------------------- hero -- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-950 to-maroon-900 text-white">
        <div className="pointer-events-none absolute inset-0 bg-hero-radial" aria-hidden="true" />

        <div className="container relative py-20 md:py-28">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-primary-100">
              <li>
                <Link href="/" className="link-underline transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-white/40">
                <ChevronRight className="h-4 w-4" />
              </li>
              <li aria-current="page" className="font-semibold text-white">
                About
              </li>
            </ol>
          </nav>

          <Reveal className="mt-8 max-w-3xl">
            <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200">
              {COLLEGE.tagline}
            </span>
            <h1 className="heading-xl mt-6 text-white">About the College</h1>
            <p className="lede mt-6 max-w-2xl text-primary-100">
              {COLLEGE.short} is a constituent college of {COLLEGE.trust}, teaching in Bengaluru
              since {COLLEGE.established}. What follows is the whole of it — how the college
              began, what it is trying to do, who leads it and what its students have achieved.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------- welcome -- */}
      <section aria-labelledby="welcome-heading" className="section">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
            <Reveal className="max-w-3xl">
              <span className="eyebrow">Welcome</span>
              <h2 id="welcome-heading" className="heading-lg mt-5">
                An education meant to be used
              </h2>

              <p className="lede mt-6">{WELCOME[0]}</p>

              <div className="mt-5 space-y-4 leading-relaxed text-muted-foreground">
                {WELCOME.slice(1).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <Button asChild variant="outline" size="lg" className="mt-9">
                <Link href="/departments">
                  Explore our programmes
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </Reveal>

            <Reveal direction="left" delay={0.12} amount={0.15}>
              <aside aria-labelledby="facts-heading" className="lg:sticky lg:top-28">
                <Card className="border-t-4 border-t-gold">
                  <CardHeader>
                    <CardTitle id="facts-heading" className="text-lg">
                      At a glance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="divide-y divide-border">
                      {QUICK_FACTS.map((fact) => (
                        <div key={fact.term} className="py-3 first:pt-0 last:pb-0">
                          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-300">
                            {fact.term}
                          </dt>
                          <dd className="mt-1.5 text-sm leading-relaxed text-foreground/85">
                            {fact.detail}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              </aside>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- vision & mission -- */}
      <section id="vision" aria-labelledby="vision-heading" className="section bg-secondary/40">
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">What guides us</span>
            <h2 id="vision-heading" className="heading-lg mt-5">
              Vision &amp; Mission
            </h2>
            <p className="lede mt-5">
              Two statements, adopted by the Trust and reviewed at every accreditation cycle.
              They decide what {COLLEGE.short} builds next, and what it declines to build.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {PILLARS.map((pillar, index) => {
              const Icon = pillar.icon

              return (
                <Reveal key={pillar.title} delay={0.08 * index} amount={0.2}>
                  <Card className="h-full border-t-4 border-t-gold transition-shadow hover:shadow-lift">
                    <CardHeader className="space-y-0">
                      <span
                        aria-hidden="true"
                        className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-gold-700 dark:text-gold-300"
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <CardTitle className="text-2xl">{pillar.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-relaxed text-muted-foreground">{pillar.body}</p>
                    </CardContent>
                  </Card>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- principal’s desk -- */}
      <section id="principal" aria-labelledby="principal-heading" className="section">
        <div className="container">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Principal’s Desk</span>
            <h2 id="principal-heading" className="heading-lg mt-5">
              A message from the Principal
            </h2>
          </Reveal>

          <Reveal className="mx-auto mt-12 max-w-4xl" delay={0.1} amount={0.15}>
            <figure className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-maroon-900 px-6 py-12 text-white shadow-lift sm:px-12 md:py-16">
              <div
                className="pointer-events-none absolute inset-0 bg-hero-radial"
                aria-hidden="true"
              />
              <Quote
                aria-hidden="true"
                strokeWidth={1}
                className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-gold/20"
              />

              <blockquote className="relative">
                <p className="font-display text-xl leading-relaxed sm:text-2xl sm:leading-[1.5]">
                  {PRINCIPAL.message}
                </p>
              </blockquote>

              <span aria-hidden="true" className="relative mt-8 block h-px w-16 bg-gold" />

              <figcaption className="relative mt-6 flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold/40 bg-white/10 font-display text-base font-bold tracking-wide text-gold-200 backdrop-blur-md"
                >
                  {PRINCIPAL_INITIALS}
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold">
                    {PRINCIPAL.name}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold uppercase tracking-[0.14em] text-gold-200">
                    {PRINCIPAL.title}, {COLLEGE.short}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------- achievements -- */}
      <section
        id="achievements"
        aria-labelledby="achievements-heading"
        className="section bg-secondary/40"
      >
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              Achievements
            </span>
            <h2 id="achievements-heading" className="heading-lg mt-5">
              Recent recognition
            </h2>
            <p className="lede mt-5">
              Awards, records and reaccreditation from the last four years — earned by students
              and staff of {COLLEGE.short}, in reverse order.
            </p>
          </Reveal>

          {/* Year markers sit on the gold rule; the list stays a real <ol> so
              the order is announced to assistive technology. */}
          <ol className="relative mt-14 max-w-3xl border-l-2 border-gold/40 pl-8 sm:pl-12">
            {ACHIEVEMENTS.map((achievement, index) => (
              <Reveal
                key={achievement.year}
                as="li"
                className="relative pb-10 last:pb-0"
                delay={Math.min(index, 3) * 0.06}
                amount={0.3}
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-8 top-1.5 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-gold bg-background sm:-left-12"
                />

                <p className="font-display text-2xl font-bold leading-none text-gold-700 dark:text-gold-300">
                  {achievement.year}
                </p>

                <div className="mt-3 rounded-2xl border bg-card p-5 shadow-card transition-shadow hover:shadow-lift sm:p-6">
                  <h3 className="font-display text-lg font-semibold">{achievement.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {achievement.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------- trust -- */}
      <section id="trust" aria-labelledby="trust-heading" className="section">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <span className="eyebrow">Our Trust</span>
              <h2 id="trust-heading" className="heading-lg mt-5">
                Two rooms in 1930, twenty-four institutions today
              </h2>

              <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
                {TRUST_STORY.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Reveal>

            <Reveal direction="left" delay={0.12} amount={0.15}>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* The founding year is set in type rather than counted up — a
                    year with a thousands separator reads as a quantity. */}
                <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-primary-900 to-primary-950 p-6 text-white sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-200">
                    Serving since
                  </p>
                  <p className="mt-2 font-display text-5xl font-bold leading-none text-gold-300">
                    {COLLEGE.established}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-primary-100">
                    Founded by Smt. Anandamma and Smt. Seethamma with about twenty children in
                    two rooms in Seshadripuram.
                  </p>
                </div>

                {TRUST_STATS.map((stat) => {
                  const Icon = stat.icon

                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border bg-card p-6 shadow-card transition-shadow hover:shadow-lift"
                    >
                      <span
                        aria-hidden="true"
                        className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-gold-700 dark:text-gold-300"
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <CountUp
                        value={stat.value}
                        suffix={stat.suffix}
                        className="block font-display text-3xl font-bold leading-none tracking-tight"
                      />

                      <p className="mt-2 text-sm font-semibold">{stat.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {stat.detail}
                      </p>
                    </div>
                  )
                })}

                <div className="rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-6">
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {COLLEGE.short} is one of those institutions — and the figures above are the
                    Trust’s, not the college’s alone.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ accreditations -- */}
      <section
        aria-label="Accreditation and recognition"
        className="border-y border-gold/20 bg-primary-950 py-14 text-white md:py-16"
      >
        <div className="container">
          <RevealGroup className="grid grid-cols-2 gap-y-10 md:grid-cols-4" stagger={0.08}>
            {BADGES.map((badge, index) => (
              <RevealItem
                key={badge.label}
                className={cn(
                  'px-3 text-center sm:px-6',
                  index > 0 && 'md:border-l md:border-gold/25',
                )}
              >
                <p className="font-display text-2xl font-bold leading-tight text-gold-300 sm:text-3xl">
                  {badge.label}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  {badge.detail}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  )
}
