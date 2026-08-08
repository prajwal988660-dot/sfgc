'use client'

import * as React from 'react'
import Link from 'next/link'
import { Home, RotateCcw, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { COLLEGE } from '@/content/college'

/**
 * Root error boundary. Next.js renders this in place of the page when a
 * Server or Client Component throws below the root layout.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // The visitor never sees the stack; this puts it somewhere a developer can.
    console.error('[sfgc] unhandled error on the public site:', error)
  }, [error])

  return (
    <section className="section">
      <div className="container">
        <div className="mx-auto max-w-xl rounded-3xl border bg-card p-8 text-center shadow-card sm:p-12">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full
                       border border-maroon/30 bg-maroon/10 text-maroon"
            aria-hidden="true"
          >
            <TriangleAlert className="h-6 w-6" />
          </span>

          <h1 className="heading-lg mt-6 text-3xl sm:text-4xl">Something went wrong</h1>

          <p className="lede mt-5 text-base sm:text-lg">
            This page failed to load. It is a problem at our end, not yours — try again, and if it
            keeps happening, tell the college office so we can fix it.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>

            <Button asChild size="lg" variant="outline">
              <Link href="/">
                <Home aria-hidden="true" />
                Back to the homepage
              </Link>
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Still stuck? Email{' '}
            <a href={`mailto:${COLLEGE.email}`} className="font-medium text-primary link-underline dark:text-primary-200">
              {COLLEGE.email}
            </a>
            .
          </p>

          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
