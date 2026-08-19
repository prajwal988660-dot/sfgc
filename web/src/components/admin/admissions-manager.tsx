'use client'

import * as React from 'react'
import { ExternalLink, FileText, Loader2, Search, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import type { Admission, AdmissionListItem, AdmissionStatus } from '@sfgc/shared'
import { formatDate } from '@sfgc/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { browserApi, errorMessage } from '@/lib/api'

/**
 * The admissions queue.
 *
 * Only super admins and admissions officers reach this — the API refuses
 * everyone else, including teachers and content admins, because these records
 * hold applicants' addresses, dates of birth and identity documents.
 */

const STATUSES: ReadonlyArray<{ value: AdmissionStatus; label: string }> = [
  { value: 'SUBMITTED', label: 'New' },
  { value: 'UNDER_REVIEW', label: 'Reviewing' },
  { value: 'DOCUMENTS_REQUESTED', label: 'Docs needed' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
  { value: 'ENROLLED', label: 'Enrolled' },
]

const STATUS_LABEL = new Map(STATUSES.map((s) => [s.value, s.label]))

export function AdmissionsManager() {
  const [rows, setRows] = React.useState<AdmissionListItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [status, setStatus] = React.useState<'' | AdmissionStatus>('')
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [openId, setOpenId] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const { items, meta } = await browserApi.admissions.list({
        status: status || undefined,
        q: search || undefined,
        limit: 50,
      })
      setRows(items)
      setTotal(meta.total)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [status, search])

  React.useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(timer)
  }, [load])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Applications submitted through the website.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={status === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatus('')}
        >
          All
        </Button>
        {STATUSES.map((s) => (
          <Button
            key={s.value}
            variant={status === s.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Label htmlFor="adm-q" className="sr-only">
          Search applications
        </Label>
        <Input
          id="adm-q"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email or application number"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading applications…
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <UserRound className="mx-auto mb-3 h-8 w-8 opacity-40" aria-hidden="true" />
          No applications match.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {rows.length} of {total} application(s)
          </p>
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id}>
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
                  <Badge variant="outline" className="font-mono">
                    {row.applicationNo}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.email} · {row.phone}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">{row.programmeName}</span>
                  <Badge variant="outline">{STATUS_LABEL.get(row.status) ?? row.status}</Badge>
                  {row.documentCount > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      {row.documentCount}
                    </span>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenId(openId === row.id ? null : row.id)}
                  >
                    {openId === row.id ? 'Close' : 'Open'}
                  </Button>
                </div>

                {openId === row.id ? (
                  <AdmissionDetail id={row.id} onChanged={() => void load()} />
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/**
 * One application in full, loaded only when opened.
 *
 * Fetched separately rather than expanded from the list row: the detail
 * response carries the applicant's address, date of birth and private review
 * notes, and none of that belongs in a response that renders fifty rows.
 */
function AdmissionDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [record, setRecord] = React.useState<Admission | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notes, setNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const full = await browserApi.admissions.get(id)
        if (cancelled) return
        setRecord(full)
        setNotes(full.reviewNotes ?? '')
      } catch (caught) {
        if (!cancelled) toast.error(errorMessage(caught))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function review(next: { status?: AdmissionStatus; reviewNotes?: string | null }) {
    setSaving(true)
    try {
      await browserApi.admissions.review(id, next)
      toast.success('Application updated')
      onChanged()
      const full = await browserApi.admissions.get(id)
      setRecord(full)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading application…
      </div>
    )
  }

  if (!record) return null

  const field = (label: string, value: React.ReactNode) => (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )

  return (
    <div className="mt-2 space-y-6 rounded-xl border border-border bg-muted/40 p-6">
      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        {field('Date of birth', record.dateOfBirth ? formatDate(record.dateOfBirth) : null)}
        {field('Guardian', record.guardianName)}
        {field('Guardian phone', record.guardianPhone)}
        {field('Qualifying exam', record.qualifyingExam)}
        {field('Board / university', record.boardUniversity)}
        {field('Year of passing', record.yearOfPassing)}
        {field('Marks', record.marksObtained)}
        {field('Applied on', formatDate(record.createdAt))}
        {field(
          'Decided',
          record.decidedAt
            ? `${formatDate(record.decidedAt)}${record.reviewedBy ? ` by ${record.reviewedBy.name}` : ''}`
            : null,
        )}
      </dl>

      {record.address ? (
        <div className="text-sm">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Address</dt>
          <dd className="mt-0.5 whitespace-pre-wrap">{record.address}</dd>
        </div>
      ) : null}

      <div>
        <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Documents</h4>
        {record.documents.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            None attached. The applicant was asked to bring them to the office.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {record.documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{doc.fileName ?? doc.kind}</span>
                {doc.fileUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer noopener">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      View
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Document storage is not configured
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {record.documents.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            These links are private and expire after a few minutes. Reopen the application to
            get a fresh one rather than sharing the link.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`notes-${id}`}>Office notes</Label>
        <Textarea
          id={`notes-${id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Internal only — never shown to the applicant."
        />
        {notes !== (record.reviewNotes ?? '') ? (
          <Button size="sm" disabled={saving} onClick={() => void review({ reviewNotes: notes })}>
            Save notes
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={record.status === s.value ? 'default' : 'outline'}
            disabled={saving || record.status === s.value}
            onClick={() => void review({ status: s.value })}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
