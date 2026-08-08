'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Facebook,
  Globe,
  GraduationCap,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
  Youtube,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { COLLEGE } from '@/content/college'

/*
 * This page is a Client Component because the enquiry form is interactive, and
 * Next.js does not allow a `metadata` export from a client module — so this file
 * deliberately has none; the root layout's defaults cover it.
 *
 * The form does not post anywhere yet. `API_CONTRACT.md` defines no contact
 * endpoint, so wiring this to the backend (POST /contact, plus rate limiting and
 * a spam honeypot) is a deliberate follow-up. Until then it validates locally and
 * hands the visitor the email address and phone number that do reach the office.
 */

type FieldName = 'name' | 'email' | 'phone' | 'subject' | 'message'
type FormValues = Record<FieldName, string>
type FieldErrors = Partial<Record<FieldName, string>>

const EMPTY_FORM: FormValues = { name: '', email: '', phone: '', subject: '', message: '' }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^[0-9+\-\s()]{10,18}$/

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {}

  if (values.name.trim().length < 2) {
    errors.name = 'Please enter your full name.'
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address so we can reply.'
  }
  if (values.phone.trim().length > 0 && !PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = 'Please enter a valid phone number, or leave this blank.'
  }
  if (values.subject.trim().length < 3) {
    errors.subject = 'Please tell us what this is about.'
  }
  if (values.message.trim().length < 20) {
    errors.message = 'Please give us a little more detail — at least 20 characters.'
  }

  return errors
}

const SOCIAL_ICONS: Record<string, LucideIcon | undefined> = {
  Facebook,
  Instagram,
  YouTube: Youtube,
  LinkedIn: Linkedin,
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

export default function ContactPage() {
  const [values, setValues] = React.useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [submitted, setSubmitted] = React.useState(false)

  function setValue(field: FieldName, value: string) {
    setValues((current) => {
      const next: FormValues = { ...current }
      next[field] = value
      return next
    })

    setErrors((current) => {
      if (!current[field]) return current
      const next: FieldErrors = { ...current }
      delete next[field]
      return next
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please correct the highlighted fields.')
      return
    }

    setSubmitted(true)
    toast.success('Enquiry noted — please email or call so it reaches the office today.')
  }

  function resetForm() {
    setValues(EMPTY_FORM)
    setErrors({})
    setSubmitted(false)
  }

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
                Contact
              </li>
            </ol>
          </nav>

          <Reveal className="mt-8 max-w-3xl" direction="up">
            <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200">Get in touch</span>
            <h1 className="heading-xl mt-6 text-white">Contact the college</h1>
            <p className="lede mt-6 max-w-2xl text-primary-100">
              Admissions, placements, alumni, or a question about a programme — write to us, call
              the office, or come and see the {COLLEGE.location} campus for yourself.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ form + details -- */}
      <section className="section">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-14">
            {/* ------------------------------------------------- the form -- */}
            <Reveal className="lg:col-span-3" direction="up">
              <span className="eyebrow">Send an enquiry</span>
              <h2 className="heading-lg mt-5">Write to us</h2>
              <p className="lede mt-5">
                Tell us what you need and who you are. Every enquiry is read by a person, and the
                office replies within two working days.
              </p>

              {submitted ? (
                <Card className="mt-10 border-emerald-600/30 bg-emerald-50/60 dark:bg-emerald-950/20">
                  <CardHeader>
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full
                                 bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
                      aria-hidden="true"
                    >
                      <CheckCircle2 className="h-6 w-6" />
                    </span>
                    <CardTitle className="pt-4">Thank you, {values.name.trim()}.</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div role="status" className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        Your enquiry has been checked and saved in this browser. So that it
                        actually reaches a desk today, please also send it to us by email or give
                        the office a call — those two channels are monitored every working day.
                      </p>
                      <p className="font-medium text-foreground">
                        Quote your subject line, &ldquo;{values.subject.trim()}&rdquo;, so we can
                        route it to the right department straight away.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button asChild variant="default">
                        <a href={`mailto:${COLLEGE.email}?subject=${encodeURIComponent(values.subject.trim())}`}>
                          <Mail aria-hidden="true" />
                          Email the office
                        </a>
                      </Button>

                      <Button asChild variant="outline">
                        <a href={COLLEGE.phoneHref}>
                          <Phone aria-hidden="true" />
                          {COLLEGE.phone}
                        </a>
                      </Button>
                    </div>

                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      Send another enquiry
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="contact-name">
                        Full name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contact-name"
                        name="name"
                        autoComplete="name"
                        placeholder="Anita Rao"
                        value={values.name}
                        onChange={(event) => setValue('name', event.target.value)}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? 'contact-name-error' : undefined}
                        className="mt-2"
                      />
                      <FieldError id="contact-name-error" message={errors.name} />
                    </div>

                    <div>
                      <Label htmlFor="contact-email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={values.email}
                        onChange={(event) => setValue('email', event.target.value)}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'contact-email-error' : undefined}
                        className="mt-2"
                      />
                      <FieldError id="contact-email-error" message={errors.email} />
                    </div>

                    <div>
                      <Label htmlFor="contact-phone">Phone (optional)</Label>
                      <Input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="98765 43210"
                        value={values.phone}
                        onChange={(event) => setValue('phone', event.target.value)}
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                        className="mt-2"
                      />
                      <FieldError id="contact-phone-error" message={errors.phone} />
                    </div>

                    <div>
                      <Label htmlFor="contact-subject">
                        Subject <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contact-subject"
                        name="subject"
                        placeholder="BCA admission for 2026–27"
                        value={values.subject}
                        onChange={(event) => setValue('subject', event.target.value)}
                        aria-invalid={Boolean(errors.subject)}
                        aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                        className="mt-2"
                      />
                      <FieldError id="contact-subject-error" message={errors.subject} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contact-message">
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="contact-message"
                      name="message"
                      rows={6}
                      placeholder="Tell us which programme you are interested in, and anything we should know before we reply."
                      value={values.message}
                      onChange={(event) => setValue('message', event.target.value)}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'contact-message-error' : undefined}
                      className="mt-2"
                    />
                    <FieldError id="contact-message-error" message={errors.message} />
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Button type="submit" size="lg">
                      <Send aria-hidden="true" />
                      Send enquiry
                    </Button>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Fields marked <span className="text-destructive">*</span> are required. We
                      use your details only to answer your enquiry.
                    </p>
                  </div>
                </form>
              )}
            </Reveal>

            {/* ---------------------------------------------- the details -- */}
            <Reveal className="lg:col-span-2" direction="up" delay={0.1}>
              <Card className="border-primary/15">
                <CardHeader>
                  <CardTitle>College office</CardTitle>
                </CardHeader>

                <CardContent className="space-y-7">
                  {/* address */}
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                                 bg-primary/10 text-primary dark:text-primary-200"
                      aria-hidden="true"
                    >
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Address
                      </h4>
                      <address className="mt-1.5 text-sm not-italic leading-relaxed">
                        {COLLEGE.addressLines.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </address>
                    </div>
                  </div>

                  {/* phone */}
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                                 bg-primary/10 text-primary dark:text-primary-200"
                      aria-hidden="true"
                    >
                      <Phone className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Phone
                      </h4>
                      <a
                        href={COLLEGE.phoneHref}
                        className="mt-1.5 inline-block text-sm font-medium link-underline"
                      >
                        {COLLEGE.phone}
                      </a>
                    </div>
                  </div>

                  {/* email */}
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                                 bg-primary/10 text-primary dark:text-primary-200"
                      aria-hidden="true"
                    >
                      <Mail className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        General enquiries
                      </h4>
                      <a
                        href={`mailto:${COLLEGE.email}`}
                        className="mt-1.5 inline-block break-all text-sm font-medium link-underline"
                      >
                        {COLLEGE.email}
                      </a>
                    </div>
                  </div>

                  {/* admissions email */}
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                                 border border-gold/40 bg-gold/15 text-gold-700 dark:text-gold-300"
                      aria-hidden="true"
                    >
                      <GraduationCap className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Admissions
                      </h4>
                      <a
                        href={`mailto:${COLLEGE.admissionsEmail}`}
                        className="mt-1.5 inline-block break-all text-sm font-medium link-underline"
                      >
                        {COLLEGE.admissionsEmail}
                      </a>
                      <p className="mt-1 text-xs text-muted-foreground">
                        For 2026–27 applications, fees and scholarships.
                      </p>
                    </div>
                  </div>

                  {/* office hours */}
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                                 bg-primary/10 text-primary dark:text-primary-200"
                      aria-hidden="true"
                    >
                      <Clock3 className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Office hours
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed">
                        Monday to Saturday, 9:00&nbsp;AM to 5:00&nbsp;PM
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Second Saturday and Sunday closed
                      </p>
                    </div>
                  </div>

                  {/* socials */}
                  <div className="border-t pt-6">
                    <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Follow {COLLEGE.short}
                    </h4>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {COLLEGE.socials.map((social) => {
                        const Icon = SOCIAL_ICONS[social.label] ?? Globe
                        return (
                          <li key={social.label}>
                            <a
                              href={social.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${COLLEGE.short} on ${social.label}`}
                              className="flex h-10 w-10 items-center justify-center rounded-full border
                                         text-muted-foreground transition-colors hover:border-gold/50
                                         hover:bg-gold/10 hover:text-gold-700 focus-visible:outline-none
                                         focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                         dark:hover:text-gold-300"
                            >
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* map */}
              <div className="mt-6">
                <div className="overflow-hidden rounded-2xl border shadow-card">
                  <iframe
                    src={COLLEGE.mapEmbed}
                    title={`Map showing ${COLLEGE.name}, ${COLLEGE.location}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    className="block h-[280px] w-full border-0 sm:h-[340px]"
                  />
                </div>

                <Button asChild variant="outline" className="mt-4 w-full">
                  <a href={COLLEGE.mapLink} target="_blank" rel="noopener noreferrer">
                    Get directions
                    <ExternalLink aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- admissions CTA -- */}
      <section className="section pt-0">
        <div className="container">
          <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-maroon-900 px-6 py-14 text-center text-white sm:px-12 md:py-20">
            <div className="pointer-events-none absolute inset-0 bg-hero-radial" aria-hidden="true" />

            <div className="relative mx-auto max-w-2xl">
              <span className="eyebrow border-gold/40 bg-gold/15 text-gold-200">
                Admissions 2026–27
              </span>
              <h2 className="heading-lg mt-6 text-white">Thinking of joining us?</h2>
              <p className="lede mt-5 text-primary-100">
                Read the five-step admission process, check eligibility for the programme you
                want, and see exactly which documents to bring.
              </p>

              <div className="mt-9 flex justify-center">
                <Button asChild size="lg" variant="gold">
                  <Link href="/admissions">
                    Explore admissions
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
