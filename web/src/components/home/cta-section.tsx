import Link from 'next/link'
import { ArrowRight, MessagesSquare, Phone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/motion/reveal'
import { COLLEGE, COURSES } from '@/content/college'

/**
 * Closing band that sits directly above the footer. Server component.
 */
export function CtaSection() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="border-t-4 border-maroon-700 bg-primary-900 text-white"
    >
      <div className="container section">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal direction="up">
            <p className="eyebrow text-gold-200 dark:text-gold-200">{COLLEGE.tagline}</p>
          </Reveal>

          <Reveal direction="up" delay={0.08}>
            <h2
              id="cta-heading"
              className="heading-lg mt-5 text-balance text-[1.75rem] leading-tight sm:text-4xl lg:text-[2.75rem]"
            >
              Admissions Open for 2026–27
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
                className="link-underline inline-flex items-center gap-1.5 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
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
