import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Atom,
  Briefcase,
  Building2,
  Calculator,
  ChevronRight,
  CircuitBoard,
  Clock,
  Code2,
  Database,
  Dna,
  Dumbbell,
  FlaskConical,
  Globe2,
  GraduationCap,
  HeartPulse,
  Languages,
  Library,
  LineChart,
  Mic2,
  MonitorSmartphone,
  Phone,
  Plane,
  Presentation,
  Theater,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { COLLEGE, COURSES, DEPARTMENTS, FACILITIES } from '@/content/college'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Departments & Programmes',
  description:
    `${COURSES.ug.length} undergraduate and ${COURSES.pg.length} postgraduate programmes across ` +
    `${DEPARTMENTS.length} departments at ${COLLEGE.name}, ${COLLEGE.location} — commerce, ` +
    'management, computer applications, life and physical sciences, languages and physical ' +
    'education, with laboratories, library and campus facilities.',
  alternates: { canonical: '/departments' },
  openGraph: {
    url: '/departments',
    title: `Departments & Programmes — ${COLLEGE.name}`,
    description: `UG and PG programmes at ${COLLEGE.short}, ${COLLEGE.location}.`,
  },
}

/*
 * Explicit icon maps, keyed on the literal unions taken off the content file.
 * Nothing indexes the lucide namespace dynamically: add a course, department or
 * facility with an unmapped icon and TypeScript fails the build instead of the
 * page rendering a hole.
 */
type CourseIconName =
  | (typeof COURSES.ug)[number]['icon']
  | (typeof COURSES.pg)[number]['icon']

const COURSE_ICONS: Record<CourseIconName, LucideIcon> = {
  LineChart,
  Database,
  Code2,
  Briefcase,
  Plane,
  Dna,
  CircuitBoard,
  GraduationCap,
  MonitorSmartphone,
  TrendingUp,
  Globe2,
}

type DepartmentIconName = (typeof DEPARTMENTS)[number]['icon']

const DEPARTMENT_ICONS: Record<DepartmentIconName, LucideIcon> = {
  Calculator,
  Briefcase,
  Code2,
  Dna,
  Atom,
  Languages,
  Dumbbell,
  Library,
}

type FacilityIconName = (typeof FACILITIES)[number]['icon']

const FACILITY_ICONS: Record<FacilityIconName, LucideIcon> = {
  Presentation,
  Library,
  Theater,
  Mic2,
  FlaskConical,
  Dumbbell,
  UtensilsCrossed,
  Building2,
  HeartPulse,
}

type Course = (typeof COURSES.ug)[number] | (typeof COURSES.pg)[number]

const PAGE_SECTIONS: ReadonlyArray<{ href: string; label: string }> = [
  { href: '#ug', label: 'Undergraduate' },
  { href: '#pg', label: 'Postgraduate' },
  { href: '#departments', label: 'Departments' },
  { href: '#facilities', label: 'Facilities' },
]

const CARD_LIFT = cn(
  'transition-all duration-300 ease-out',
  'hover:-translate-y-1 hover:border-gold/60 hover:shadow-lift',
)

/** One programme card. Richer than the homepage tabs: icon, code, duration and
 *  the full blurb, all visible without a click. */
function CourseCard({ course }: { course: Course }) {
  const Icon = COURSE_ICONS[course.icon]

  return (
    <Card className={cn('flex h-full flex-col border-border/70', CARD_LIFT)}>
      <CardHeader className="space-y-2">
        <span
          aria-hidden="true"
          className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-primary-200"
        >
          <Icon className="h-6 w-6" />
        </span>

        <CardTitle className="text-xl">{course.name}</CardTitle>
        <CardDescription className="text-[0.9375rem]">{course.blurb}</CardDescription>
      </CardHeader>

      <CardFooter className="mt-auto flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        <Badge variant="gold">{course.code}</Badge>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {course.duration}
        </span>
      </CardFooter>
    </Card>
  )
}

export default function DepartmentsPage() {
  const programmeCount = COURSES.ug.length + COURSES.pg.length

  return (
    <>
      {/* ---------------------------------------------------------- hero -- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white">
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
                Departments
              </li>
            </ol>
          </nav>

          <Reveal className="mt-8 max-w-3xl">
            <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200">Academics</span>
            <h1 className="heading-xl mt-6 text-white">Departments &amp; Programmes</h1>
            <p className="lede mt-6 max-w-2xl text-primary-100">
              {programmeCount} programmes taught by {DEPARTMENTS.length} departments on one
              campus in {COLLEGE.location} — every course listed here in full, with its
              duration, its department and what it actually covers.
            </p>
          </Reveal>

          <Reveal delay={0.12} amount={0.4}>
            <nav aria-label="On this page" className="mt-10">
              <ul className="flex flex-wrap gap-2.5">
                {PAGE_SECTIONS.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2
                                 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold
                                 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
                    >
                      {item.label}
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------- undergraduate -- */}
      <section id="ug" aria-labelledby="ug-heading" className="section">
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">Undergraduate</span>
            <h2 id="ug-heading" className="heading-lg mt-5">
              {COURSES.ug.length} UG programmes
            </h2>
            <p className="lede mt-5">
              Three-year degrees in commerce, management, computer applications and science.
              Entry is on the qualifying examination — PUC or 10+2. {COLLEGE.affiliation}.
            </p>
          </Reveal>

          <RevealGroup
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            stagger={0.06}
          >
            {COURSES.ug.map((course) => (
              <RevealItem key={course.code} className="min-w-0">
                <CourseCard course={course} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* -------------------------------------------------- postgraduate -- */}
      <section id="pg" aria-labelledby="pg-heading" className="section bg-secondary/40">
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">Postgraduate</span>
            <h2 id="pg-heading" className="heading-lg mt-5">
              {COURSES.pg.length} PG programmes
            </h2>
            <p className="lede mt-5">
              Two-year master’s degrees for graduates who want depth — advanced commerce,
              computing, management and an internationally benchmarked global MBA.
            </p>
          </Reveal>

          <RevealGroup
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.06}
          >
            {COURSES.pg.map((course) => (
              <RevealItem key={course.code} className="min-w-0">
                <CourseCard course={course} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* --------------------------------------------------- departments -- */}
      <section id="departments" aria-labelledby="departments-heading" className="section">
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">Faculties</span>
            <h2 id="departments-heading" className="heading-lg mt-5">
              The {DEPARTMENTS.length} departments
            </h2>
            <p className="lede mt-5">
              Each department keeps its own faculty, laboratories and learning resources, and
              teaches the programmes listed against it.
            </p>
          </Reveal>

          <RevealGroup
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            stagger={0.05}
          >
            {DEPARTMENTS.map((department) => {
              const Icon = DEPARTMENT_ICONS[department.icon]

              return (
                <RevealItem key={department.slug} className="min-w-0">
                  <article id={department.slug} className="h-full">
                    <Card className={cn('flex h-full flex-col border-border/70', CARD_LIFT)}>
                      <CardHeader className="space-y-2">
                        <span
                          aria-hidden="true"
                          className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-maroon/10 text-maroon dark:bg-white/10 dark:text-gold-300"
                        >
                          <Icon className="h-6 w-6" />
                        </span>

                        <CardTitle className="text-xl">{department.name}</CardTitle>
                        <CardDescription className="text-[0.9375rem]">
                          {department.blurb}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="mt-auto pt-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-300">
                          Programmes
                        </p>
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {department.programmes.map((programme) => (
                            <li key={programme}>
                              <Badge variant="secondary" className="text-[11px]">
                                {programme}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </article>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------------------------------------------- facilities -- */}
      <section id="facilities" aria-labelledby="facilities-heading" className="section bg-secondary/40">
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">Campus</span>
            <h2 id="facilities-heading" className="heading-lg mt-5">
              Facilities
            </h2>
            <p className="lede mt-5">
              Everything the teaching depends on, spread across 3.5 acres — classrooms,
              laboratories, the library, halls, sport and student welfare.
            </p>
          </Reveal>

          <RevealGroup
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            stagger={0.05}
          >
            {FACILITIES.map((facility) => {
              const Icon = FACILITY_ICONS[facility.icon]

              return (
                <RevealItem key={facility.name} className="min-w-0">
                  <div
                    className={cn(
                      'flex h-full gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-card',
                      CARD_LIFT,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-primary-200"
                    >
                      <Icon className="h-6 w-6" />
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold leading-snug">
                        {facility.name}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {facility.blurb}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      </section>

      {/* ----------------------------------------------------------- cta -- */}
      <section
        aria-labelledby="departments-cta-heading"
        className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-950 to-maroon-900 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-hero-radial" aria-hidden="true" />

        <div className="container relative py-16 md:py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200">Admissions</span>
            <h2 id="departments-cta-heading" className="heading-lg mt-6 text-white">
              Still deciding which programme fits?
            </h2>
            <p className="lede mt-5 text-primary-100">
              The admissions office will walk you through eligibility, the documents you need
              and what each programme leads to after graduation.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="gold">
                <Link href="/admissions">
                  Start your application
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="glass">
                <a href={COLLEGE.phoneHref}>
                  <Phone aria-hidden="true" />
                  {COLLEGE.phone}
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
