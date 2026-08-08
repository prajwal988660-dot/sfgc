'use client'

import * as React from 'react'
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  Mail,
  Ticket,
  Users,
} from 'lucide-react'

import { ApiError, formatDateTime, formatFee } from '@sfgc/shared'
import type { Event, EventRegistrationInput, EventRegistrationResult } from '@sfgc/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Reveal } from '@/components/motion/reveal'
import { browserApi, errorMessage } from '@/lib/api'
import { toast } from 'sonner'

type FieldName = 'name' | 'email' | 'phone' | 'college' | 'teamName' | 'teamMembers'

/** Tab order — also the order the first invalid field is hunted in. */
const FIELD_ORDER: readonly FieldName[] = [
  'name',
  'email',
  'phone',
  'college',
  'teamName',
  'teamMembers',
]

type Values = Record<FieldName, string>
type Errors = Partial<Record<FieldName, string>>

const EMPTY_VALUES: Values = {
  name: '',
  email: '',
  phone: '',
  college: '',
  teamName: '',
  teamMembers: '',
}

/**
 * Deliberately permissive: the backend is the authority on what it accepts.
 * This only catches the obvious typo before spending a round trip on it.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/

/** Categories where entering as a team is the norm rather than the exception. */
const TEAM_CATEGORY_HINTS: readonly string[] = [
  'fest',
  'hackathon',
  'competition',
  'contest',
  'tournament',
  'sports',
  'quiz',
]

function suggestsTeamEntry(category: string): boolean {
  const value = category.toLowerCase()
  return TEAM_CATEGORY_HINTS.some((hint) => value.includes(hint))
}

/** Accepts "+91 98765 43210", "098765-43210" and friends; reduces to 10 digits. */
function normalisePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

function validate(values: Values): Errors {
  const errors: Errors = {}

  if (!values.name.trim()) {
    errors.name = 'Please enter your full name.'
  }

  const email = values.email.trim()
  if (!email) {
    errors.email = 'Please enter your email address.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'That does not look like a valid email address.'
  }

  if (values.phone.trim() && normalisePhone(values.phone).length !== 10) {
    errors.phone = 'Enter a 10-digit mobile number, or leave this blank.'
  }

  return errors
}

/** Maps an API detail path ("body.email", "email") onto one of our fields. */
function fieldFromPath(path: string): FieldName | null {
  const key = path.split('.').pop() ?? ''
  return FIELD_ORDER.includes(key as FieldName) ? (key as FieldName) : null
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="flex items-start gap-1.5 text-xs font-medium text-destructive">
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

export function RegisterForm({ event }: { event: Event }) {
  const uid = React.useId()

  const [values, setValues] = React.useState<Values>(EMPTY_VALUES)
  const [errors, setErrors] = React.useState<Errors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [result, setResult] = React.useState<EventRegistrationResult | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [copyFailed, setCopyFailed] = React.useState(false)

  const nameRef = React.useRef<HTMLInputElement>(null)
  const emailRef = React.useRef<HTMLInputElement>(null)
  const phoneRef = React.useRef<HTMLInputElement>(null)
  const collegeRef = React.useRef<HTMLInputElement>(null)
  const teamNameRef = React.useRef<HTMLInputElement>(null)
  const teamMembersRef = React.useRef<HTMLTextAreaElement>(null)
  const codeRef = React.useRef<HTMLSpanElement>(null)
  const successRef = React.useRef<HTMLDivElement>(null)
  const copyTimer = React.useRef<number | null>(null)

  const refs = React.useMemo<Record<FieldName, React.RefObject<HTMLElement>>>(
    () => ({
      name: nameRef,
      email: emailRef,
      phone: phoneRef,
      college: collegeRef,
      teamName: teamNameRef,
      teamMembers: teamMembersRef,
    }),
    [],
  )

  /**
   * "Has it started?" is answered after mount rather than during render:
   * reading the clock while rendering would let the server and client markup
   * disagree. The interval also closes the form for a visitor who left the
   * page open through the start time.
   */
  const [started, setStarted] = React.useState(false)
  React.useEffect(() => {
    const startsAt = Date.parse(event.startsAt)
    if (Number.isNaN(startsAt)) return
    const check = () => setStarted(startsAt <= Date.now())
    check()
    const timer = window.setInterval(check, 30_000)
    return () => window.clearInterval(timer)
  }, [event.startsAt])

  // The submit button unmounts on success, so send focus to the panel replacing it.
  React.useEffect(() => {
    if (result) successRef.current?.focus()
  }, [result])

  React.useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
    },
    [],
  )

  const soldOut = event.seatsLeft !== null && event.seatsLeft <= 0
  const closed = !event.registrationOpen || started || soldOut
  const teamEvent = suggestsTeamEntry(event.category)

  function focusFirstInvalid(next: Errors) {
    const first = FIELD_ORDER.find((field) => next[field])
    if (first) refs[first].current?.focus()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const field = e.target.name as FieldName
    const { value } = e.target
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function applyApiError(error: unknown) {
    if (error instanceof ApiError) {
      if (error.code === 'CONFLICT') {
        const message = 'This email is already registered for this event.'
        setErrors({ email: message })
        setFormError(null)
        toast.error(message, {
          description: 'Check your inbox for the ticket code, or use another address.',
        })
        refs.email.current?.focus()
        return
      }

      if (error.code === 'VALIDATION_ERROR' && error.details?.length) {
        const fieldErrors: Errors = {}
        const unmatched: string[] = []
        for (const detail of error.details) {
          const field = fieldFromPath(detail.path)
          if (!field) unmatched.push(detail.message)
          else if (!fieldErrors[field]) fieldErrors[field] = detail.message
        }
        setErrors(fieldErrors)
        // Anything the server rejected that is not one of our inputs — a closed
        // or full event, say — has to be said at form level or it is invisible.
        setFormError(unmatched.length > 0 ? unmatched.join(' ') : null)
        focusFirstInvalid(fieldErrors)
        toast.error(errorMessage(error))
        return
      }
    }

    const message = errorMessage(error)
    setFormError(message)
    toast.error(message)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting || result) return

    const nextErrors = validate(values)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setFormError(null)
      focusFirstInvalid(nextErrors)
      return
    }

    setErrors({})
    setFormError(null)
    setSubmitting(true)

    const payload: EventRegistrationInput = {
      name: values.name.trim(),
      email: values.email.trim(),
    }
    const phone = normalisePhone(values.phone)
    if (phone) payload.phone = phone
    const college = values.college.trim()
    if (college) payload.college = college
    const teamName = values.teamName.trim()
    if (teamName) payload.teamName = teamName
    const teamMembers = values.teamMembers.trim()
    if (teamMembers) payload.teamMembers = teamMembers

    try {
      const registration = await browserApi.events.register(event.id, payload)
      setResult(registration)
      toast.success('Registration confirmed', {
        description: `Ticket code ${registration.ticketCode}`,
      })
    } catch (error) {
      applyApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  /** Puts the code in the visitor's selection so Ctrl/Cmd+C still works. */
  function selectCode() {
    const node = codeRef.current
    const selection = window.getSelection()
    if (!node || !selection) return
    const range = document.createRange()
    range.selectNodeContents(node)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  async function copyCode() {
    if (!result) return
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(result.ticketCode)
      setCopyFailed(false)
      setCopied(true)
      toast.success('Ticket code copied')
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Permission denied, or an insecure origin. Select it instead of failing.
      setCopied(false)
      setCopyFailed(true)
      selectCode()
      toast.error('Could not copy automatically', {
        description: 'The code is selected — press Ctrl/Cmd + C to copy it.',
      })
    }
  }

  // ------------------------------------------------------------ success ----

  if (result) {
    const waitlisted = result.registration.status === 'WAITLISTED'

    return (
      <Reveal direction="up" amount={0.1}>
        <Card
          ref={successRef}
          tabIndex={-1}
          className="overflow-hidden border-emerald-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div
            aria-hidden="true"
            className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-gold-400 to-primary"
          />

          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <CheckCircle2
                className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <CardTitle>You&rsquo;re registered</CardTitle>
              <Badge variant={waitlisted ? 'warning' : 'success'}>
                {waitlisted ? 'Waitlisted' : 'Confirmed'}
              </Badge>
            </div>
            <CardDescription>
              {waitlisted
                ? 'You are on the waiting list. The organisers will confirm by email if a seat frees up.'
                : `A seat is held for ${result.registration.name}.`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-5 text-center sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Your ticket code
              </p>
              <span
                ref={codeRef}
                className="mt-3 block select-all break-all font-mono text-2xl font-bold tracking-[0.18em] text-primary sm:text-3xl dark:text-primary-200"
              >
                {result.ticketCode}
              </span>
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={copyCode}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy code'}
              </Button>
              <p aria-live="polite" className="sr-only">
                {copied ? 'Ticket code copied to the clipboard.' : ''}
              </p>
              {copyFailed ? (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Clipboard access was denied. The code above is selected — press
                  Ctrl/Cmd&nbsp;+&nbsp;C, or write it down.
                </p>
              ) : null}
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <dt className="sr-only">Event</dt>
                <Ticket
                  className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                  aria-hidden="true"
                />
                <dd className="font-semibold text-foreground">{result.event.title}</dd>
              </div>
              <div className="flex items-start gap-2.5">
                <dt className="sr-only">Date and time</dt>
                <CalendarDays
                  className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                  aria-hidden="true"
                />
                <dd className="text-muted-foreground">
                  {formatDateTime(result.event.startsAt)}
                  {result.event.venue ? ` · ${result.event.venue}` : ''}
                </dd>
              </div>
              <div className="flex items-start gap-2.5">
                <dt className="sr-only">Registered email</dt>
                <Mail
                  className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-300"
                  aria-hidden="true"
                />
                <dd className="break-all text-muted-foreground">{result.registration.email}</dd>
              </div>
            </dl>

            <p className="rounded-xl bg-secondary px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
              Keep this code safe — you will be asked for it at the entry desk.
            </p>
          </CardContent>
        </Card>
      </Reveal>
    )
  }

  // ------------------------------------------------------------- closed ----

  if (closed) {
    const heading = started
      ? 'This event has started'
      : soldOut
        ? 'Fully booked'
        : 'Registration closed'

    const reason = started
      ? `This event began on ${formatDateTime(event.startsAt)}, so online registration has closed.`
      : soldOut
        ? `Every seat has been taken${
            event.capacity ? ` — all ${event.capacity} of them` : ''
          }. Registration reopens only if a place frees up.`
        : 'The organisers have closed online registration for this event.'

    return (
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2.5">
            {soldOut && !started ? (
              <Users className="size-5 shrink-0 text-maroon dark:text-maroon-300" aria-hidden="true" />
            ) : (
              <Lock className="size-5 shrink-0 text-maroon dark:text-maroon-300" aria-hidden="true" />
            )}
            <CardTitle>{heading}</CardTitle>
          </div>
          <CardDescription>{reason}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <Button type="button" disabled className="w-full sm:w-auto">
            <Lock aria-hidden="true" />
            Registration closed
          </Button>

          {event.contactEmail || event.contactPhone ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Still hoping for a place? Write to{' '}
              {event.contactEmail ? (
                <a
                  className="link-underline font-medium text-primary dark:text-primary-200"
                  href={`mailto:${event.contactEmail}`}
                >
                  {event.contactEmail}
                </a>
              ) : null}
              {event.contactEmail && event.contactPhone ? ' or call ' : null}
              {event.contactPhone ? (
                <a
                  className="link-underline font-medium text-primary dark:text-primary-200"
                  href={`tel:${event.contactPhone.replace(/\s+/g, '')}`}
                >
                  {event.contactPhone}
                </a>
              ) : null}
              {event.contactName ? ` (${event.contactName}).` : '.'}
            </p>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  // --------------------------------------------------------------- form ----

  /**
   * Shared wiring for every control. The error message replaces the hint in the
   * DOM, so `aria-describedby` points at whichever one is actually rendered.
   */
  const fieldProps = (field: FieldName, hintId?: string) => ({
    id: `${uid}-${field}`,
    name: field,
    value: values[field],
    onChange: handleChange,
    disabled: submitting,
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `${uid}-${field}-error` : hintId,
  })

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Register for this event</CardTitle>
        <CardDescription>
          {formatFee(event.fee)}
          {event.seatsLeft !== null ? ` · ${event.seatsLeft} seats left` : ''} · Fields marked
          with an asterisk are required.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="space-y-6">
          {formError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${uid}-name`}>
                Full name <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Input
                ref={nameRef}
                autoComplete="name"
                placeholder="Anita Rao"
                required
                {...fieldProps('name')}
              />
              <FieldError id={`${uid}-name-error`} message={errors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${uid}-email`}>
                Email <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Input
                ref={emailRef}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="anita@example.com"
                required
                {...fieldProps('email')}
              />
              <FieldError id={`${uid}-email-error`} message={errors.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${uid}-phone`}>Mobile number</Label>
              <Input
                ref={phoneRef}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                {...fieldProps('phone', `${uid}-phone-hint`)}
              />
              {errors.phone ? (
                <FieldError id={`${uid}-phone-error`} message={errors.phone} />
              ) : (
                <p id={`${uid}-phone-hint`} className="text-xs text-muted-foreground">
                  Optional. 10 digits, so the organisers can reach you on the day.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${uid}-college`}>College or organisation</Label>
              <Input
                ref={collegeRef}
                autoComplete="organization"
                placeholder="Seshadripuram First Grade College"
                {...fieldProps('college')}
              />
              <FieldError id={`${uid}-college-error`} message={errors.college} />
            </div>
          </div>

          <fieldset className="space-y-5 rounded-2xl border border-border/70 bg-secondary/40 p-5">
            <legend className="px-2 text-sm font-semibold">
              Team entry
              {teamEvent ? null : (
                <span className="font-normal text-muted-foreground"> (optional)</span>
              )}
            </legend>
            <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
              {teamEvent
                ? 'This event is usually entered as a team. Name your team and list everyone taking part — leave both blank if you are entering alone.'
                : 'Only fill these in if you are entering alongside others.'}
            </p>

            <div className="space-y-2">
              <Label htmlFor={`${uid}-teamName`}>Team name</Label>
              <Input
                ref={teamNameRef}
                placeholder="Team Sambhram"
                className="bg-background"
                {...fieldProps('teamName')}
              />
              <FieldError id={`${uid}-teamName-error`} message={errors.teamName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${uid}-teamMembers`}>Team members</Label>
              <Textarea
                ref={teamMembersRef}
                rows={3}
                placeholder="Ravi Kumar, Meera Nair, Aditya Shetty"
                className="bg-background"
                {...fieldProps('teamMembers', `${uid}-teamMembers-hint`)}
              />
              {errors.teamMembers ? (
                <FieldError id={`${uid}-teamMembers-error`} message={errors.teamMembers} />
              ) : (
                <p id={`${uid}-teamMembers-hint`} className="text-xs text-muted-foreground">
                  Separate each name with a comma.
                </p>
              )}
            </div>
          </fieldset>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Registering&hellip;
                </>
              ) : (
                <>
                  <Ticket aria-hidden="true" />
                  Confirm registration
                </>
              )}
            </Button>
            <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-[18rem] sm:text-right">
              Your details go only to the organisers of {event.title}.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
