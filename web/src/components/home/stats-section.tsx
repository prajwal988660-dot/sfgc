import { CountUp } from '@/components/motion/count-up'
import { RevealGroup, RevealItem } from '@/components/motion/reveal'
import { COLLEGE, STATS } from '@/content/college'
import { cn } from '@/lib/utils'

/**
 * The figures band. Deep navy, full bleed, and the only place on the homepage
 * where numbers are allowed to shout — so the gold stays meaningful elsewhere.
 */
export function StatsSection() {
  return (
    <section
      aria-label={`${COLLEGE.short} at a glance`}
      className="relative overflow-hidden border-y border-gold/20 bg-primary-950 py-16 text-white md:py-24"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-hero-radial opacity-70" />

      <div className="container relative">
        <RevealGroup className="grid grid-cols-2 gap-y-12 md:grid-cols-4" stagger={0.1}>
          {STATS.map((stat, index) => (
            <RevealItem
              key={stat.label}
              className={cn(
                'px-2 text-center sm:px-6',
                // Hairlines only once the four sit on a single row.
                // md, not lg: the grid becomes four columns at md, so the
                // separators must appear at the same breakpoint the row does.
                index > 0 && 'md:border-l md:border-gold/25',
              )}
            >
              {/* "20,000+" carries no break opportunity, so at 360px — two
                  columns of roughly 150px — a 4xl display face overflows the
                  page. The size steps down for the smallest screens only. */}
              <CountUp
                value={stat.value}
                suffix={stat.suffix}
                decimals={stat.decimals}
                className="block font-display text-3xl font-bold leading-none tracking-tight text-gold-300 sm:text-5xl lg:text-6xl"
              />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 sm:text-sm">
                {stat.label}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
