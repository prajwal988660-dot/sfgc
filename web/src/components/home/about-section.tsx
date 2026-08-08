import type { CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight, Compass, Eye, Landmark, Quote } from 'lucide-react'

import { Reveal } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { COLLEGE, MISSION, PRINCIPAL, VISION, WELCOME } from '@/content/college'
import { cn } from '@/lib/utils'

/**
 * The floating card carries a taste of the principal's message; the whole text
 * stays on /about. Truncating by sentence — rather than pasting a shortened
 * copy here — means an edit in college.ts flows through on its own.
 *
 * The split point is a full stop followed by whitespace and a capital, so
 * abbreviations such as "S.F.G.C" survive intact. This runs on the server only
 * (no "use client" in this file), so lookbehind is safe.
 */
function firstSentences(text: string, count: number): string {
  return text
    .split(/(?<=[.!?])\s+(?=["“'‘(]?[A-Z])/)
    .slice(0, count)
    .join(' ')
    .trim()
}

const PRINCIPAL_PULL_QUOTE = firstSentences(PRINCIPAL.message, 2)

const PILLARS = [
  { title: 'Vision', body: VISION, icon: Eye },
  { title: 'Mission', body: MISSION, icon: Compass },
] as const

/** A faint measured grid over the gradient panel, so it reads as a designed
 *  surface instead of a flat colour fill. */
const PANEL_GRID: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
  backgroundSize: '56px 56px',
}

export function AboutSection() {
  return (
    <section id="about" className="section">
      <div className="container">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          {/* ------------------------------------------------------ copy -- */}
          <Reveal>
            <p className="eyebrow">About the College</p>

            <h2 className="heading-lg mt-5">{COLLEGE.name}</h2>

            <p className="lede mt-5">{WELCOME[0]}</p>

            <div className="mt-5 space-y-4 leading-relaxed text-muted-foreground">
              {WELCOME.slice(1).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <Button asChild variant="outline" size="lg" className="mt-9">
              <Link href="/about">
                Read more about us
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Reveal>

          {/* --------------------------------------------------- visual -- */}
          <Reveal direction="left" delay={0.12}>
            {/* The bottom margin reserves room for the card that hangs below
                the panel, so it never collides with the cards underneath. */}
            <div className="relative mb-20">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-900 to-maroon-900 shadow-lift sm:aspect-[16/11] lg:aspect-[4/5]">
                <div aria-hidden="true" className="absolute inset-0 bg-hero-radial" />
                <div aria-hidden="true" className="absolute inset-0 opacity-[0.18]" style={PANEL_GRID} />

                {/* Concentric rules — a quiet nod to a seal or crest. */}
                <div
                  aria-hidden="true"
                  className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-gold/25"
                />
                <div
                  aria-hidden="true"
                  className="absolute -right-28 -top-12 h-80 w-80 rounded-full border border-white/10"
                />

                <Landmark
                  aria-hidden="true"
                  strokeWidth={0.9}
                  className="pointer-events-none absolute -bottom-6 -right-6 h-52 w-52 text-white/[0.08] sm:h-64 sm:w-64"
                />

                <div className="relative flex h-full flex-col p-7 sm:p-9">
                  <span className="font-display text-5xl font-bold leading-none text-white/90 sm:text-6xl">
                    {COLLEGE.short}
                  </span>

                  <span aria-hidden="true" className="mt-5 block h-px w-14 bg-gold" />

                  <p className="mt-5 max-w-[16rem] font-display text-xl leading-snug text-white sm:text-2xl">
                    {COLLEGE.tagline}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Badge variant="glass">{COLLEGE.accreditation}</Badge>
                    <Badge variant="glass">{COLLEGE.iso}</Badge>
                  </div>
                </div>
              </div>

              {/* Floating card, overlapping the panel's lower corner. Kept at
                  85% opacity rather than the default 70% so the quote still
                  clears AA where it sits over the dark gradient. */}
              <div
                className={cn(
                  'glass absolute -bottom-12 left-4 right-4 rounded-2xl bg-white/85 p-5 shadow-glass',
                  'ring-1 ring-primary/10 sm:left-8 sm:right-8 sm:p-6 lg:-left-8 lg:right-6',
                  'dark:bg-primary-950/85 dark:ring-white/10',
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-maroon/10 text-maroon dark:bg-white/10 dark:text-gold-300"
                  >
                    <Quote className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold leading-tight text-foreground">
                      {PRINCIPAL.name}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-300">
                      {PRINCIPAL.title}
                    </p>
                  </div>
                </div>

                <blockquote className="mt-4 border-l-2 border-gold pl-4 text-sm leading-relaxed text-foreground/80">
                  {PRINCIPAL_PULL_QUOTE}
                </blockquote>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ------------------------------------------- vision & mission -- */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:mt-20">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon
            return (
              <Reveal key={pillar.title} delay={0.08 * index}>
                <Card className="h-full border-t-4 border-t-gold hover:shadow-lift">
                  <CardHeader className="space-y-0">
                    <span
                      aria-hidden="true"
                      className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-gold-700 dark:text-gold-300"
                    >
                      <Icon className="h-5 w-5" />
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
  )
}
