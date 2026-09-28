import Link from 'next/link'
import { ArrowRight, MessagesSquare, Phone } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/motion/reveal'
import { COLLEGE, COURSES } from '@/content/college'

/**
 * Closing band that sits directly above the footer. Server component — the
 * only client code here is the Reveal primitive, which carries its own
 * 'use client' boundary.
 */
export function CtaSection() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative isolate overflow-hidden bg-gradient-to-br from-maroon-900 via-maroon-800 to-primary-950 text-white"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-hero-radial" />
        <div className="absolute -left-24 -top-28 h-[22rem] w-[22rem] rounded-full bg-maroon-500/25 blur-[120px]" />
        <div className="absolute -bottom-32 -right-16 h-[24rem] w-[24rem] rounded-full bg-primary-600/30 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      {/* Gold hairline separating the band from the section above it. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent"
      />

      <div className="container section">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal direction="up">
            <Badge variant="glass" className="px-3 py-1 uppercase tracking-[0.12em]">
              {COLLEGE.tagline}
            </Badge>
          </Reveal>

          <Reveal direction="up" delay={0.08}>
            <h2
              id="cta-heading"
              className="heading-lg mt-5 text-balance text-[1.75rem] leading-tight sm:text-4xl lg:text-[2.75rem]"
            >
              Admissions for 2026–27 are open
            </h2>
          </Reveal>

          <Reveal direction="up" delay={0.14}>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
              Choose from {COURSES.ug.length} undergraduate and {COURSES.pg.length} postgraduate
              programmes at {COLLEGE.name} — {COLLEGE.accreditation}, {COLLEGE.iso}. Our
              admissions team will take you through eligibility, documents and fees.
            </p>
          </Reveal>

          <Reveal direction="up" delay={0.2}>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Button asChild variant="gold" size="lg" className="w-full sm:w-auto">
                <Link href="/admissions">
                  Apply Now
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="glass" size="lg" className="w-full sm:w-auto">
                <Link href="/contact">
                  <MessagesSquare aria-hidden="true" />
                  Talk to us
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal direction="up" delay={0.26}>
            <p className="mt-7 text-sm text-white/70">
              Prefer to call?{' '}
              <a
                href={COLLEGE.phoneHref}
                className="link-underline inline-flex items-center gap-1.5 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-maroon-900"
              >
                <Phone className="size-4" aria-hidden="true" />
                {COLLEGE.phone}
              </a>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
