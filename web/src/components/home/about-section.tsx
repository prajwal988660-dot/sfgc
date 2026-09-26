import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Compass, Eye, Quote } from 'lucide-react'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { COLLEGE, MISSION, PRINCIPAL, VISION, WELCOME } from '@/content/college'

/**
 * The principal's card carries a taste of the principal's message; the whole text
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

export function AboutSection() {
  return (
    <section id="about" className="section">
      <div className="container">
        <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-16">
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
          <Reveal>
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border shadow-card">
                <Image
                  src="/campus-building.webp"
                  alt={`The ${COLLEGE.name} building, ${COLLEGE.location}`}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover object-[center_65%]"
                />
              </div>
              <figcaption className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
                <span>The college building, New Town, Yelahanka</span>
                <span>Photo: Sham Robinson</span>
              </figcaption>
            </figure>

            <div className="mt-6 rounded-lg border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary dark:text-primary-200"
                >
                  <Quote className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-base font-semibold leading-tight text-foreground">
                    {PRINCIPAL.name}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {PRINCIPAL.title}
                  </p>
                </div>
              </div>

              <blockquote className="mt-4 border-l-2 border-maroon-600 pl-4 text-sm leading-relaxed text-foreground/80">
                {PRINCIPAL_PULL_QUOTE}
              </blockquote>
            </div>
          </Reveal>
        </div>

        {/* ------------------------------------------- vision & mission -- */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:mt-20">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon
            return (
              <Reveal key={pillar.title} delay={0.08 * index}>
                <Card className="h-full">
                  <CardHeader className="space-y-0">
                    <span
                      aria-hidden="true"
                      className="mb-4 grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary dark:text-primary-200"
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
