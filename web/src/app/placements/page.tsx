import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ChevronRight, Mail } from 'lucide-react'

import { PlacementsSection } from '@/components/home/placements-section'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { COLLEGE, PLACEMENT_STATS, RECRUITERS } from '@/content/college'

export const metadata: Metadata = {
  title: 'Placements',
  description:
    'How Seshadripuram First Grade College prepares students for work — aptitude and communication training, mock interviews, internships, industry mentoring and campus recruitment drives held through the year.',
  openGraph: {
    title: `Placements — ${COLLEGE.name}`,
    description:
      'The Career & Placement Cell at SFGC: training, internships, mentoring and campus recruitment drives.',
  },
}

/**
 * Page-scoped copy. Everything editorial belongs in `content/college.ts`; this
 * lives here only because the preparation programme has no home there yet —
 * move it across when that file next changes.
 */
const PREPARATION = [
  {
    title: 'Aptitude training',
    detail:
      'Quantitative reasoning, logical ability and verbal aptitude, taught in timed weekly sessions from the second year and benchmarked against the tests recruiters actually set.',
  },
  {
    title: 'Communication and soft skills',
    detail:
      'Group discussions, presentation practice, business writing and workplace etiquette, run with the Languages department so confidence grows alongside fluency.',
  },
  {
    title: 'Mock interviews',
    detail:
      'Panel and technical mock interviews with faculty and visiting industry professionals, each followed by written feedback on exactly what to fix before the real thing.',
  },
  {
    title: 'Internships and live projects',
    detail:
      'Structured internships and industry projects with partner organisations, supervised by a faculty mentor and frequently converted into pre-placement offers.',
  },
  {
    title: 'Industry mentoring',
    detail:
      'Alumni and industry mentors assigned by discipline, with pre-placement talks on campus and guidance for students choosing higher study or competitive examinations instead.',
  },
] as const

const partnerStat = PLACEMENT_STATS.find((stat) => stat.label === 'Recruiting Partners')

export default function PlacementsPage() {
  return (
    <>
      {/* ---------------------------------------------------------- hero -- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white">
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
                Placements
              </li>
            </ol>
          </nav>

          <Reveal className="mt-8 max-w-3xl" direction="up">
            <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200">
              Career &amp; Placement Cell
            </span>
            <h1 className="heading-xl mt-6 text-white">
              Prepared for work, not just for exams
            </h1>
            <p className="lede mt-6 max-w-2xl text-primary-100">
              {COLLEGE.short} exists to turn a degree into a livelihood. From aptitude class in
              the second year to the offer letter in the final semester, the Career &amp;
              Placement Cell stays with every student — and brings recruiters onto campus in{' '}
              {COLLEGE.location} through the year.
            </p>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------- stats + recruiters -- */}
      <PlacementsSection />

      {/* --------------------------------------------------- preparation -- */}
      <section id="preparation" className="section">
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">Preparation</span>
            <h2 className="heading-lg mt-5">How we prepare you</h2>
            <p className="lede mt-5">
              Five things happen between admission and placement. None of them is optional, and
              none of them waits until the last semester.
            </p>
          </Reveal>

          <ol className="ml-6 mt-14 max-w-3xl border-l border-border">
            {PREPARATION.map((step, index) => (
              <Reveal
                key={step.title}
                as="li"
                direction="up"
                amount={0.4}
                className="relative pb-8 pl-8 last:pb-0 sm:pl-10"
              >
                <span
                  className="absolute -left-5 top-0 flex h-10 w-10 items-center justify-center
                             rounded-full border border-gold/40 bg-gold/15 font-display text-sm
                             font-bold text-gold-700 dark:text-gold-300"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>

                <div className="rounded-xl border bg-card p-5 shadow-card transition-shadow hover:shadow-lift sm:p-6">
                  <h3 className="font-display text-lg font-semibold">
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{step.detail}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------- top recruiters -- */}
      <section id="recruiters" className="section bg-secondary/40">
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">Partners</span>
            <h2 className="heading-lg mt-5">Top recruiters</h2>
            <p className="lede mt-5">
              Organisations that have recruited from {COLLEGE.short} across technology, finance,
              consulting, banking and services
              {partnerStat
                ? ` — part of a network of ${partnerStat.value}${partnerStat.suffix} recruiting partners.`
                : '.'}
            </p>
          </Reveal>

          <RevealGroup
            className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            stagger={0.04}
          >
            {RECRUITERS.map((name) => (
              <RevealItem key={name}>
                <div
                  className="flex h-24 items-center justify-center rounded-xl border bg-card px-4
                             text-center font-display text-base font-semibold text-primary-800
                             shadow-card transition duration-200 hover:-translate-y-0.5
                             hover:border-gold/40 hover:shadow-lift dark:text-primary-100"
                >
                  {name}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* --------------------------------------------------- employer CTA -- */}
      <section className="section">
        <div className="container">
          <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-maroon-900 px-6 py-14 text-center text-white sm:px-12 md:py-20">
            <div className="pointer-events-none absolute inset-0 bg-hero-radial" aria-hidden="true" />

            <div className="relative mx-auto max-w-2xl">
              <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200">
                For employers
              </span>
              <h2 className="heading-lg mt-6 text-white">Recruit on campus</h2>
              <p className="lede mt-5 text-primary-100">
                We host recruitment drives, pre-placement talks and internship partnerships
                throughout the academic year, with graduating cohorts in commerce, management,
                computer applications and science. Tell us what you are hiring for and the
                Placement Cell will arrange a date.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="gold">
                  <Link href="/contact">
                    Talk to the Placement Cell
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>

                <Button asChild size="lg" variant="glass">
                  <a href={`mailto:${COLLEGE.email}`}>
                    <Mail aria-hidden="true" />
                    {COLLEGE.email}
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
