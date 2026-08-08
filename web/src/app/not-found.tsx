import Link from 'next/link'
import { ArrowRight, CalendarDays, Home } from 'lucide-react'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { COLLEGE } from '@/content/college'

/**
 * Root 404. Stays a Server Component — `Reveal` carries its own client
 * boundary, so the page itself never ships JavaScript for the layout.
 */
export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center" direction="up" amount={0}>
          <p
            className="select-none bg-gradient-to-br from-primary-700 via-primary-500 to-gold-500
                       bg-clip-text font-display text-[6.5rem] font-bold leading-none text-transparent
                       sm:text-[9rem] lg:text-[11rem]
                       dark:from-primary-300 dark:via-primary-200 dark:to-gold-300"
            aria-hidden="true"
          >
            404
          </p>

          <h1 className="heading-lg mt-6">This page has moved on</h1>

          <p className="lede mt-5">
            The link you followed does not lead anywhere on the {COLLEGE.short} website — it may
            have been renamed, or the notice it pointed to may have expired. Nothing is broken on
            your side.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/">
                <Home aria-hidden="true" />
                Back to the homepage
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline">
              <Link href="/events">
                <CalendarDays aria-hidden="true" />
                See what&rsquo;s on
              </Link>
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Looking for something specific?{' '}
            <Link href="/contact" className="font-medium text-primary link-underline dark:text-primary-200">
              Ask the college office
              <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
