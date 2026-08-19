'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle2, Copy, FileUp, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import type { AdmissionSubmitResult, Stream } from '@sfgc/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { browserApi, errorMessage } from '@/lib/api'
import { COLLEGE } from '@/content/college'

/**
 * The public admission form.
 *
 * Submitted by people with no account, so everything here assumes an anxious
 * stranger on a phone: one column, plain language, errors named against the
 * field they belong to, and a receipt they can screenshot at the end.
 */

/** Mirrors the server's limits. Checked here only to fail fast and kindly. */
const MAX_FILES = 5
const MAX_FILE_BYTES = 4 * 1024 * 1024
const MAX_TOTAL_BYTES = 10 * 1024 * 1024
const ACCEPTED = 'image/jpeg,image/png,image/webp,application/pdf'

interface Values {
  name: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  guardianName: string
  guardianPhone: string
  streamId: string
  programmeName: string
  qualifyingExam: string
  boardUniversity: string
  yearOfPassing: string
  marksObtained: string
}

const EMPTY: Values = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  guardianName: '',
  guardianPhone: '',
  streamId: '',
  programmeName: '',
  qualifyingExam: '',
  boardUniversity: '',
  yearOfPassing: '',
  marksObtained: '',
}

export function ApplicationForm() {
  const [values, setValues] = React.useState<Values>(EMPTY)
  const [files, setFiles] = React.useState<File[]>([])
  const [streams, setStreams] = React.useState<Stream[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<AdmissionSubmitResult | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    void (async () => {
      try {
        setStreams(await browserApi.streams.list())
      } catch {
        // The programme list is a convenience: the field beside it is free
        // text, so the form still works if the API is asleep.
      }
    })()
  }, [])

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function addFiles(picked: FileList | null) {
    if (!picked) return
    const next = [...files]
    for (const file of Array.from(picked)) {
      if (next.length >= MAX_FILES) {
        toast.error(`You can attach at most ${MAX_FILES} documents.`)
        break
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is over ${MAX_FILE_BYTES / 1024 / 1024} MB.`)
        continue
      }
      next.push(file)
    }
    const total = next.reduce((sum, file) => sum + file.size, 0)
    if (total > MAX_TOTAL_BYTES) {
      toast.error(`Your documents total more than ${MAX_TOTAL_BYTES / 1024 / 1024} MB.`)
      return
    }
    setFiles(next)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)
    try {
      const submitted = await browserApi.admissions.submit(
        {
          name: values.name,
          email: values.email,
          phone: values.phone,
          dateOfBirth: values.dateOfBirth || undefined,
          address: values.address || undefined,
          guardianName: values.guardianName || undefined,
          guardianPhone: values.guardianPhone || undefined,
          streamId: values.streamId || undefined,
          programmeName: values.programmeName,
          qualifyingExam: values.qualifyingExam || undefined,
          boardUniversity: values.boardUniversity || undefined,
          yearOfPassing: values.yearOfPassing ? Number(values.yearOfPassing) : undefined,
          marksObtained: values.marksObtained || undefined,
        },
        files,
      )
      setResult(submitted)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
        <h2 className="mt-4 font-display text-2xl font-semibold">Application received</h2>
        <p className="mt-2 text-muted-foreground">{result.message}</p>

        <div className="mx-auto mt-6 max-w-xs rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Your application number
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">{result.applicationNo}</p>
        </div>

        <Button
          variant="outline"
          className="mt-5"
          onClick={() => {
            void navigator.clipboard
              .writeText(result.applicationNo)
              .then(() => toast.success('Copied'))
              .catch(() => toast.error('Could not copy — please write it down.'))
          }}
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy number
        </Button>

        <p className="mt-6 text-sm text-muted-foreground">
          Please write this down or take a screenshot. Quote it whenever you contact the
          admissions office on {COLLEGE.phone} or {COLLEGE.admissionsEmail}.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <fieldset className="space-y-5" disabled={submitting}>
        <legend className="font-display text-lg font-semibold">About you</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ap-name">Full name *</Label>
            <Input
              id="ap-name"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-dob">Date of birth</Label>
            <Input
              id="ap-dob"
              type="date"
              value={values.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ap-email">Email *</Label>
            <Input
              id="ap-email"
              type="email"
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-phone">Phone *</Label>
            <Input
              id="ap-phone"
              type="tel"
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              autoComplete="tel"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ap-address">Address</Label>
          <Textarea
            id="ap-address"
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
            rows={2}
            autoComplete="street-address"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ap-guardian">Parent or guardian</Label>
            <Input
              id="ap-guardian"
              value={values.guardianName}
              onChange={(e) => set('guardianName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-guardian-phone">Their phone</Label>
            <Input
              id="ap-guardian-phone"
              type="tel"
              value={values.guardianPhone}
              onChange={(e) => set('guardianPhone', e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5" disabled={submitting}>
        <legend className="font-display text-lg font-semibold">What you want to study</legend>

        <div className="space-y-2">
          <Label htmlFor="ap-programme">Programme *</Label>
          <select
            id="ap-programme"
            value={values.streamId}
            onChange={(e) => {
              const chosen = streams.find((stream) => stream.id === e.target.value)
              set('streamId', e.target.value)
              // The free-text name travels with the application, so the record
              // still says what was applied for if the stream is later renamed.
              set('programmeName', chosen ? (chosen.shortName ?? chosen.name) : '')
            }}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            <option value="">Choose a programme…</option>
            {streams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ap-exam">Qualifying exam</Label>
            <Input
              id="ap-exam"
              value={values.qualifyingExam}
              onChange={(e) => set('qualifyingExam', e.target.value)}
              placeholder="PUC / 10+2 / B.Com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-board">Board or university</Label>
            <Input
              id="ap-board"
              value={values.boardUniversity}
              onChange={(e) => set('boardUniversity', e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ap-year">Year of passing</Label>
            <Input
              id="ap-year"
              type="number"
              min={1950}
              max={new Date().getFullYear() + 1}
              value={values.yearOfPassing}
              onChange={(e) => set('yearOfPassing', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-marks">Marks or grade</Label>
            <Input
              id="ap-marks"
              value={values.marksObtained}
              onChange={(e) => set('marksObtained', e.target.value)}
              placeholder="87.5% / A1 / 9.2 CGPA"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4" disabled={submitting}>
        <legend className="font-display text-lg font-semibold">Documents (optional)</legend>
        <p className="text-sm text-muted-foreground">
          Marks card, transfer certificate, ID proof or a photograph. JPG, PNG or PDF, up to{' '}
          {MAX_FILE_BYTES / 1024 / 1024} MB each and {MAX_FILES} in total. You can also
          bring them to the office instead.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          <FileUp className="h-4 w-4" aria-hidden="true" />
          Attach documents
        </Button>

        {files.length > 0 ? (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </fieldset>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Sending your application…
          </>
        ) : (
          'Submit application'
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your details are used only to process this application. Fields marked * are required.
      </p>
    </form>
  )
}
