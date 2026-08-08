import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Award,
  Check,
  ChevronRight,
  Clock,
  Info,
  Mail,
  Phone,
} from 'lucide-react'

import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ADMISSION_STEPS, COLLEGE, COURSES, FAQS } from '@/content/college'

export const metadata: Metadata = {
  title: 'Admissions 2026–27',
  description:
    'Admissions to Seshadripuram First Grade College, Yelahanka, Bengaluru for 2026–27. The five-step process, UG and PG programmes with eligibility, the documents to bring, scholarships and answers to the questions families ask most.',
  openGraph: {
    title: `Admissions 2026–27 — ${COLLEGE.name}`,
    description:
      'Apply to UG and PG programmes at SFGC: process, eligibility, documents, scholarships and FAQs.',
  },
}

/**
 * Page-scoped copy. Everything editorial belongs in `content/college.ts`; the
 * document checklist lives here only because that file has no home for it yet —
 * move it across when it next changes.
 */
const DOCUMENTS = [
  'Marks cards for the 10th standard and the 12th standard / PUC — plus all degree marks cards for postgraduate applicants',
  'Transfer certificate (TC) from the institution last attended',
  'Migration certificate, where the qualifying examination was taken under another board or university',
  'Conduct certificate from the institution last attended',
  'Caste and income certificates, where reservation or a scholarship is being claimed',
  'Aadhaar or another government-issued photo identity document',
  'Recent passport-size photographs',
] as const

type Programme = {
  code: string
  name: string
  duration: string
  blurb: string
}

/** One programme grid, reused by both tabs so UG and PG read identically. */
function ProgrammeGrid({ items }: { items: readonly Programme[] }) {
  return (
    <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
      {items.map((programme) => (
        <RevealItem key={programme.code} className="h-full">
          <Card className="flex h-full flex-col hover:shadow-lift">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge variant="gold">{programme.code}</Badge>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {programme.duration}
                </span>
              </div>
              <CardTitle className="pt-3 text-lg">{programme.name}</CardTitle>
            </CardHeader>

            <CardContent className="mt-auto">
              <CardDescription>{programme.blurb}</CardDescription>
            </CardContent>
          </Card>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}

export default function AdmissionsPage() {
  const lastStepIndex = ADMISSION_STEPS.length - 1

  return (
    <>
      {/* ---------------------------------------------------------- hero -- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white">
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
                Admissions
              </li>
            </ol>
          </nav>

          <Reveal className="mt-8 max-w-3xl" direction="up">
            <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200">
              Applications open
            </span>
            <h1 className="heading-xl mt-6 text-white">Admissions 2026–27</h1>
            <p className="lede mt-6 max-w-2xl text-primary-100">
              Join a college that has taught in Bengaluru since {COLLEGE.established}.{' '}
              {COLLEGE.affiliation}, {COLLEGE.accreditation} and {COLLEGE.iso}. Five clear steps
              stand between an enquiry and your first day in {COLLEGE.location}.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="gold">
                <Link href="/contact">
                  Enquire about admissions
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="glass">
                <a href={COLLEGE.phoneHref}>
                  <Phone aria-hidden="true" />
                  Call {COLLEGE.phone}
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------- process -- */}
      <section id="process" className="section bg-secondary/40">
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">The process</span>
            <h2 className="heading-lg mt-5">From enquiry to enrolment</h2>
            <p className="lede mt-5">
              Nothing here is a mystery and nothing depends on knowing someone. Work through
              these five steps in order and the admissions office will meet you at each one.
            </p>
          </Reveal>

          <ol className="mt-14 grid gap-10 lg:grid-cols-5 lg:gap-6">
            {ADMISSION_STEPS.map((step, index) => (
              <Reveal
                key={step.step}
                as="li"
                direction="up"
                amount={0.3}
                delay={index * 0.06}
                className="relative pl-14 lg:pl-0"
              >
                {/* Connectors: a vertical rail on small screens, a horizontal
                    stepper rail on lg. Both stop short of the final step. */}
                {index < lastStepIndex ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute left-5 top-12 h-[calc(100%-0.5rem)] w-px bg-border lg:hidden"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute left-10 top-5 hidden h-px w-[calc(100%-1rem)]
                                 bg-gradient-to-r from-gold/50 to-border lg:block"
                    />
                  </>
                ) : null}

                <span
                  className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center
                             rounded-full border border-gold/40 bg-gold-50 font-display text-sm
                             font-bold text-gold-700 dark:bg-gold-950 dark:text-gold-300 lg:static"
                  aria-hidden="true"
                >
                  {step.step}
                </span>

                <h3 className="font-display text-lg font-semibold lg:mt-5">
                  <span className="sr-only">Step {step.step}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.detail}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------- programmes -- */}
      <section id="programmes" className="section">
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">Programmes</span>
            <h2 className="heading-lg mt-5">Choose your course</h2>
            <p className="lede mt-5">
              Seven undergraduate and four postgraduate programmes across commerce, management,
              computer applications and science — every one of them taught on the same campus, by
              the same faculty you will meet at counselling.
            </p>
          </Reveal>

          {/* Stated once, rather than repeated on eleven cards. */}
          <Reveal
            className="mt-10 flex max-w-3xl items-start gap-3 rounded-2xl border border-gold/30
                       bg-gold/10 p-5"
            direction="up"
          >
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-700 dark:text-gold-300" aria-hidden="true" />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">Eligibility.</span> Undergraduate programmes
              require a pass in PUC / 10+2 or an equivalent examination from a recognised board.
              Postgraduate programmes require a relevant bachelor&rsquo;s degree from a recognised
              university.
            </p>
          </Reveal>

          <Tabs defaultValue="ug" className="mt-10">
            <TabsList className="flex w-full max-w-sm">
              <TabsTrigger value="ug" className="flex-1">
                Undergraduate
              </TabsTrigger>
              <TabsTrigger value="pg" className="flex-1">
                Postgraduate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ug">
              <ProgrammeGrid items={COURSES.ug} />
            </TabsContent>

            <TabsContent value="pg">
              <ProgrammeGrid items={COURSES.pg} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* --------------------------------- documents and scholarships -- */}
      <section id="documents" className="section bg-secondary/40">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            <Reveal className="lg:col-span-2">
              <span className="eyebrow">Come prepared</span>
              <h2 className="heading-lg mt-5">Documents required</h2>
              <p className="lede mt-5">
                Bring the originals for verification and one photocopy of each for the file. An
                admission is only confirmed once verification is complete.
              </p>

              <ul className="mt-10 space-y-3">
                {DOCUMENTS.map((document) => (
                  <li
                    key={document}
                    className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card
                               transition-shadow hover:shadow-lift"
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center
                                 rounded-full bg-primary/10 text-primary dark:text-primary-200"
                      aria-hidden="true"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm leading-relaxed">{document}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="lg:pt-24" direction="up" delay={0.1}>
              <Card className="h-full border-gold/30">
                <CardHeader>
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full
                               border border-gold/40 bg-gold/15 text-gold-700 dark:text-gold-300"
                    aria-hidden="true"
                  >
                    <Award className="h-5 w-5" />
                  </span>
                  <CardTitle className="pt-4">Scholarships</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Cost should not decide who studies here. Students at {COLLEGE.short} can apply
                    for State Government scholarships administered through the Karnataka
                    post-matric schemes, and for Central Government schemes covering SC, ST, OBC,
                    minority and merit-cum-means categories.
                  </p>
                  <p>
                    The college adds its own merit and means-based support for students whose
                    results or circumstances warrant it, administered by the Scholarships and
                    Welfare cell.
                  </p>
                  <p>
                    Bring your caste and income certificates at admission — most schemes cannot be
                    processed without them, and the deadlines follow the university calendar
                    closely.
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- FAQs -- */}
      <section id="faqs" className="section">
        <div className="container">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">Questions</span>
            <h2 className="heading-lg mt-5">Frequently asked</h2>
            <p className="lede mt-5">
              The questions families ask us most often, answered plainly. If yours is not here,
              the admissions office will answer it on the phone.
            </p>
          </Reveal>

          <Reveal className="mx-auto mt-10 max-w-3xl" direction="up">
            <Accordion type="single" collapsible className="w-full border-t">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="font-display text-base font-semibold sm:text-lg">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------- closing CTA -- */}
      <section className="section pt-0">
        <div className="container">
          <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-maroon-900 px-6 py-14 text-center text-white sm:px-12 md:py-20">
            <div className="pointer-events-none absolute inset-0 bg-hero-radial" aria-hidden="true" />

            <div className="relative mx-auto max-w-2xl">
              <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200">
                Admissions office
              </span>
              <h2 className="heading-lg mt-6 text-white">Talk to us before you decide</h2>
              <p className="lede mt-5 text-primary-100">
                Ask about a programme, a fee, a scholarship or a hostel seat. The admissions team
                answers the phone Monday to Saturday, and replies to every email.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="gold">
                  <a href={`mailto:${COLLEGE.admissionsEmail}`}>
                    <Mail aria-hidden="true" />
                    {COLLEGE.admissionsEmail}
                  </a>
                </Button>

                <Button asChild size="lg" variant="glass">
                  <a href={COLLEGE.phoneHref}>
                    <Phone aria-hidden="true" />
                    {COLLEGE.phone}
                  </a>
                </Button>
              </div>

              <p className="mt-7 text-sm text-primary-100">
                Prefer to write it down?{' '}
                <Link href="/contact" className="font-semibold text-gold-200 underline underline-offset-4 hover:text-white">
                  Send an enquiry
                </Link>{' '}
                and we will come back to you.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
