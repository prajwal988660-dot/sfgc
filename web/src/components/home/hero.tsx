'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Landmark,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BADGES, COLLEGE, HERO_SLIDES } from '@/content/college'
import { cn } from '@/lib/utils'

/** How long each highlight stays on screen before the rotator advances. */
const SLIDE_MS = 6000

/** Typed as a tuple so Framer Motion reads it as a cubic-bezier, not number[]. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

type BadgeLabel = (typeof BADGES)[number]['label']

const BADGE_ICONS: Record<BadgeLabel, LucideIcon> = {
  'NAAC A+': Award,
  'UGC 2(f) & 12(B)': ShieldCheck,
  'ISO 9001:2015': BadgeCheck,
  'Est. 1930': Landmark,
}

export function Hero() {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)

  const slide = HERO_SLIDES[index]

  // A timeout (not an interval) keyed on `index`, so choosing a dot restarts
  // the full dwell time instead of cutting the chosen slide short.
  React.useEffect(() => {
    if (paused || reduceMotion) return
    const timer = window.setTimeout(() => {
      setIndex((index + 1) % HERO_SLIDES.length)
    }, SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [index, paused, reduceMotion])

  const container: Variants = {
    hidden: {},
    show: { transition: { delayChildren: 0.15, staggerChildren: 0.12 } },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.2 : 0.65, ease: EASE },
    },
  }

  // Shared crossfade for the three rotating pieces (tag, title, caption).
  const swap = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduceMotion ? 0 : -10 },
    transition: { duration: reduceMotion ? 0.2 : 0.7, ease: EASE },
  }

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[92svh] flex-col overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-maroon-900 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* ---------- ambient background: tint, aurora, texture ---------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Each highlight carries its own mood colours; crossfade them slowly. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.tag}
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(135deg, ${slide.from} 0%, ${slide.to} 100%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 1.4, ease: 'easeInOut' }}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-hero-radial" />

        <motion.div
          className="absolute -left-32 -top-24 h-[24rem] w-[24rem] rounded-full bg-primary-500/30 blur-[110px] sm:h-[36rem] sm:w-[36rem]"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 70, -30, 0], y: [0, -50, 40, 0], scale: [1, 1.1, 0.94, 1] }
          }
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-24 top-1/4 h-[22rem] w-[22rem] rounded-full bg-maroon-600/35 blur-[120px] sm:h-[32rem] sm:w-[32rem]"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -60, 30, 0], y: [0, 50, -30, 0], scale: [1, 0.92, 1.08, 1] }
          }
          transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 left-1/3 h-[20rem] w-[20rem] rounded-full bg-gold-500/20 blur-[130px] sm:h-[28rem] sm:w-[28rem]"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 40, -50, 0], y: [0, -30, 20, 0], scale: [1, 1.06, 0.98, 1] }
          }
          transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Fine dot grid for texture — pure CSS, no image request. */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)',
            backgroundSize: '30px 30px',
          }}
        />
        {/* Vignette keeps the type legible wherever a blob drifts. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(6,20,36,0.72)_100%)]" />
      </div>

      {/* ---------------------------- content ---------------------------- */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="container relative flex flex-1 flex-col justify-center pb-10 pt-28 sm:pt-32 lg:pt-36"
      >
        <motion.div variants={item} className="grid">
          <AnimatePresence initial={false}>
            <motion.div
              key={slide.tag}
              className="col-start-1 row-start-1 justify-self-start"
              {...swap}
            >
              <Badge variant="glass" className="px-3 py-1 tracking-[0.12em] uppercase">
                {slide.tag}
              </Badge>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.h1
          id="hero-title"
          variants={item}
          className="heading-xl mt-5 grid min-h-[8.5rem] max-w-4xl text-balance text-[2rem] leading-[1.06] sm:min-h-[9.5rem] sm:text-5xl lg:min-h-[9rem] lg:text-6xl"
        >
          <AnimatePresence initial={false}>
            <motion.span
              key={slide.title}
              className="text-gradient col-start-1 row-start-1"
              {...swap}
            >
              {slide.title}
            </motion.span>
          </AnimatePresence>
        </motion.h1>

        <motion.div variants={item} className="mt-5 grid min-h-[6.5rem] max-w-2xl sm:min-h-[5.5rem]">
          <AnimatePresence initial={false}>
            <motion.p
              key={slide.caption}
              className="col-start-1 row-start-1 text-base leading-relaxed text-white/85 sm:text-lg"
              {...swap}
            >
              {slide.caption}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <motion.div variants={item} className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild variant="gold" size="lg" className="w-full sm:w-auto">
            <Link href="/admissions">
              Explore Admissions
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="glass" size="lg" className="w-full sm:w-auto">
            <Link href="/events">
              <CalendarDays aria-hidden="true" />
              Upcoming Events
            </Link>
          </Button>
        </motion.div>

        <motion.div
          variants={item}
          role="group"
          aria-label="Choose a highlight"
          className="mt-8 flex items-center gap-1.5"
        >
          {HERO_SLIDES.map((entry, i) => {
            const active = i === index
            return (
              <button
                key={entry.tag}
                type="button"
                onClick={() => setIndex(i)}
                aria-current={active ? 'true' : undefined}
                aria-label={`Show highlight ${i + 1} of ${HERO_SLIDES.length}: ${entry.title}`}
                className="group flex h-6 items-center rounded-full px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-primary-950"
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-all duration-300',
                    active ? 'w-9 bg-gold' : 'w-2.5 bg-white/40 group-hover:bg-white/75',
                  )}
                />
              </button>
            )
          })}
        </motion.div>
      </motion.div>

      {/* ------------------- credentials strip + scroll cue ------------------- */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="container relative pb-6"
      >
        <motion.ul
          variants={item}
          className="glass-dark grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl px-4 py-4 shadow-glass sm:gap-x-6 md:grid-cols-4 md:px-6 md:py-5"
        >
          {BADGES.map((entry) => {
            const Icon = BADGE_ICONS[entry.label]
            return (
              <li key={entry.label} className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-200 ring-1 ring-gold/30">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-tight text-white sm:text-sm">
                    {entry.label}
                  </span>
                  <span className="block text-[10px] uppercase leading-tight tracking-[0.16em] text-white/70">
                    {entry.detail}
                  </span>
                </span>
              </li>
            )
          })}
        </motion.ul>

        <motion.p variants={item} className="mt-4 text-center text-xs text-white/60">
          {COLLEGE.name} · {COLLEGE.location}
        </motion.p>

        <motion.div
          variants={item}
          aria-hidden
          className="pointer-events-none mt-3 flex flex-col items-center gap-1.5 text-white/55"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <motion.span
            animate={reduceMotion ? undefined : { y: [0, 7, 0], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="size-5" />
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Hairline that closes the band against the page below. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent"
      />
    </section>
  )
}
