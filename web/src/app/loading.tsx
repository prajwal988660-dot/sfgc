import { Skeleton } from '@/components/ui/skeleton'

/**
 * Route-level loading state. Mirrors the shape every page shares — a dark hero
 * band, then two rows of cards — so the layout does not jump when content
 * arrives. No motion library, no client boundary: this must be the cheapest
 * thing the app renders.
 */
export default function Loading() {
  return (
    <>
      <p role="status" className="sr-only">
        Loading page content…
      </p>

      <div aria-hidden="true">
        {/* hero band */}
        <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950">
          <div className="container py-20 md:py-28">
            <Skeleton className="h-4 w-40 bg-white/15" />
            <Skeleton className="mt-8 h-7 w-32 rounded-full bg-white/15" />
            <Skeleton className="mt-6 h-12 w-full max-w-2xl bg-white/20 sm:h-14" />
            <Skeleton className="mt-3 h-12 w-3/4 max-w-xl bg-white/20 sm:h-14" />
            <Skeleton className="mt-7 h-5 w-full max-w-2xl bg-white/10" />
            <Skeleton className="mt-3 h-5 w-5/6 max-w-xl bg-white/10" />

            <div className="mt-9 flex flex-wrap gap-3">
              <Skeleton className="h-12 w-52 rounded-full bg-white/20" />
              <Skeleton className="h-12 w-44 rounded-full bg-white/10" />
            </div>
          </div>
        </section>

        {/* first card row */}
        <section className="section">
          <div className="container">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="mt-5 h-10 w-full max-w-md" />
            <Skeleton className="mt-5 h-5 w-full max-w-2xl" />
            <Skeleton className="mt-3 h-5 w-4/5 max-w-xl" />

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="rounded-2xl border bg-card p-6 shadow-card">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="mt-4 h-6 w-3/4" />
                  <Skeleton className="mt-4 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* second card row */}
        <section className="section pt-0">
          <div className="container">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="rounded-2xl border bg-card p-6 shadow-card">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="mt-5 h-6 w-2/3" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
