import Link from 'next/link'
import {
  Atom,
  Briefcase,
  Calculator,
  ChevronRight,
  CircuitBoard,
  Clock,
  Code2,
  Database,
  Dna,
  Dumbbell,
  Globe2,
  GraduationCap,
  Languages,
  Library,
  LineChart,
  MonitorSmartphone,
  Plane,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { COLLEGE, COURSES, DEPARTMENTS } from '@/content/college'
import { cn } from '@/lib/utils'

/**
 * Explicit icon maps. Keying the Record on the literal union pulled off the
 * content file means TypeScript fails the build the moment someone adds a
 * department or course with an icon we have not imported.
 */
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

type Course = (typeof COURSES.ug)[number] | (typeof COURSES.pg)[number]

/** Shared hover/focus treatment, so keyboard users see exactly what a mouse shows. */
const CARD_STATE = cn(
  'transition-all duration-300 ease-out',
  'group-hover:-translate-y-1.5 group-hover:border-gold/60 group-hover:shadow-lift',
  'group-focus-visible:-translate-y-1.5 group-focus-visible:border-gold/60 group-focus-visible:shadow-lift',
)

function CourseList({ courses }: { courses: readonly Course[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {courses.map((course) => {
        const Icon = COURSE_ICONS[course.icon]

        return (
          <li
            key={course.code}
            className="flex min-w-0 gap-4 rounded-xl border border-border/70 bg-background p-4
                       transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50
                       hover:shadow-card"
          >
            <span
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center
                         rounded-lg bg-primary/10 text-primary dark:text-primary-200"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <h4 className="font-display text-base font-semibold leading-snug">{course.name}</h4>
                <Badge variant="gold" className="text-[11px]">
                  {course.code}
                </Badge>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{course.blurb}</p>

              <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {course.duration}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function DepartmentsSection() {
  const programmeCount = COURSES.ug.length + COURSES.pg.length

  return (
    <section id="ug" aria-labelledby="departments-heading" className="section">
      <div className="container">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">Academics</span>
          <h2 id="departments-heading" className="heading-lg mt-5">
            {DEPARTMENTS.length} departments. {programmeCount} programmes. One campus.
          </h2>
          <p className="lede mt-5">
            Commerce, management, computing, life and physical sciences, languages and physical
            education — each with its own faculty, laboratories and learning resources, all on one
            campus in {COLLEGE.location}.
          </p>
        </Reveal>

        <RevealGroup
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          stagger={0.06}
        >
          {DEPARTMENTS.map((department) => {
            const Icon = DEPARTMENT_ICONS[department.icon]

            return (
              <RevealItem key={department.slug} className="min-w-0">
                <Link
                  href={`/departments#${department.slug}`}
                  className="group block h-full rounded-2xl focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                             focus-visible:ring-offset-background"
                >
                  <Card className={cn('flex h-full flex-col border-border/70', CARD_STATE)}>
                    <CardHeader className="pb-4">
                      <span
                        className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl
                                   bg-primary/10 text-primary transition-colors duration-300
                                   group-hover:bg-gold/20 group-hover:text-gold-700
                                   group-focus-visible:bg-gold/20 group-focus-visible:text-gold-700
                                   dark:text-primary-200 dark:group-hover:text-gold-300
                                   dark:group-focus-visible:text-gold-300"
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>

                      <CardTitle className="flex items-start justify-between gap-2 text-lg">
                        {department.name}
                        <ChevronRight
                          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-all
                                     duration-300 group-hover:translate-x-1 group-hover:text-gold-600
                                     group-focus-visible:translate-x-1 group-focus-visible:text-gold-600
                                     dark:group-hover:text-gold-300 dark:group-focus-visible:text-gold-300"
                          aria-hidden="true"
                        />
                      </CardTitle>

                      <CardDescription>{department.blurb}</CardDescription>
                    </CardHeader>

                    <CardContent className="mt-auto flex flex-wrap gap-1.5">
                      {department.programmes.map((programme) => (
                        <Badge key={programme} variant="secondary" className="text-[11px]">
                          {programme}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                </Link>
              </RevealItem>
            )
          })}
        </RevealGroup>

        <Reveal className="mt-16" amount={0.1}>
          <div className="rounded-3xl border border-border/70 bg-secondary/40 p-5 sm:p-8 lg:p-10">
            <Tabs defaultValue="ug">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight">
                    Programmes on offer
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Choose a level to see the full list.
                  </p>
                </div>

                {/* The two labels are wide enough that a nowrap inline-flex pill
                    overflows a 360px viewport. Full width with flexible
                    triggers keeps them inside the panel. */}
                <TabsList
                  aria-label="Programme level"
                  className="flex w-full self-start sm:w-auto sm:self-auto"
                >
                  <TabsTrigger value="ug" className="flex-1 px-3 sm:px-5">
                    Undergraduate
                  </TabsTrigger>
                  <TabsTrigger value="pg" className="flex-1 px-3 sm:px-5">
                    Postgraduate
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="ug">
                <CourseList courses={COURSES.ug} />
              </TabsContent>

              <TabsContent value="pg">
                <CourseList courses={COURSES.pg} />
              </TabsContent>
            </Tabs>
          </div>
        </Reveal>

        <Reveal className="mt-10 flex justify-center" amount={0.4}>
          <Button asChild size="lg" variant="outline">
            <Link href="/departments">
              View all departments
              <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
