'use client'

import * as React from 'react'
import { Loader2, Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { Notice, NoticeAudience, NoticeInput } from '@sfgc/shared'
import { formatDateTime } from '@sfgc/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { browserApi, errorMessage } from '@/lib/api'

import { ImageField } from './image-field'

const AUDIENCES: readonly { value: NoticeAudience; label: string }[] = [
  { value: 'ALL', label: 'Everyone' },
  { value: 'STUDENTS', label: 'Students only' },
  { value: 'TEACHERS', label: 'Teachers only' },
]

const CATEGORIES = ['General', 'Examination', 'Admission', 'Event', 'Holiday', 'Placement']

interface FormState {
  title: string
  body: string
  category: string
  audience: NoticeAudience
  pinned: boolean
  attachmentUrl: string
  expiresAt: string
}

const EMPTY: FormState = {
  title: '',
  body: '',
  category: 'General',
  audience: 'ALL',
  pinned: false,
  attachmentUrl: '',
  expiresAt: '',
}

/** `<input type="datetime-local">` wants `YYYY-MM-DDTHH:mm` in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function toForm(notice: Notice): FormState {
  return {
    title: notice.title,
    body: notice.body,
    category: notice.category,
    audience: notice.audience,
    pinned: notice.pinned,
    attachmentUrl: notice.attachmentUrl ?? '',
    expiresAt: toLocalInput(notice.expiresAt),
  }
}

/**
 * Blank optional fields are sent as `null`, not omitted.
 *
 * The API treats an absent key as "leave it alone" and an explicit null as
 * "clear it", so clearing an attachment only works if the null is sent.
 */
function toInput(form: FormState): NoticeInput {
  return {
    title: form.title.trim(),
    body: form.body.trim(),
    category: form.category.trim() || 'General',
    audience: form.audience,
    pinned: form.pinned,
    attachmentUrl: form.attachmentUrl.trim() || null,
    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
  }
}

export function NoticesManager() {
  const [notices, setNotices] = React.useState<Notice[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editing, setEditing] = React.useState<Notice | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(EMPTY)
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const { items } = await browserApi.notices.list({ limit: 100 })
      setNotices(items)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  function startCreate() {
    setEditing(null)
    setCreating(true)
    setForm(EMPTY)
  }

  function startEdit(notice: Notice) {
    setCreating(false)
    setEditing(notice)
    setForm(toForm(notice))
  }

  function cancel() {
    setCreating(false)
    setEditing(null)
    setForm(EMPTY)
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    try {
      const input = toInput(form)
      if (editing) {
        await browserApi.notices.update(editing.id, input)
        toast.success('Notice updated')
      } else {
        await browserApi.notices.create(input)
        toast.success('Notice published')
      }
      cancel()
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function remove(notice: Notice) {
    if (!window.confirm(`Delete "${notice.title}"? This cannot be undone.`)) return
    try {
      await browserApi.notices.remove(notice.id)
      toast.success('Notice deleted')
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
  }

  const open = creating || editing !== null

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Published straight to the website and both apps.
          </p>
        </div>
        {!open ? (
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New notice
          </Button>
        ) : null}
      </div>

      {open ? (
        <form
          onSubmit={save}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg font-semibold">
            {editing ? 'Edit notice' : 'New notice'}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Notice</Label>
            <Textarea
              id="body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
              rows={6}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                list="notice-categories"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <datalist id="notice-categories">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Who sees it</Label>
              <select
                id="audience"
                value={form.audience}
                onChange={(e) =>
                  setForm({ ...form, audience: e.target.value as NoticeAudience })
                }
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Hide after (optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to keep it up indefinitely.
            </p>
          </div>

          <ImageField
            label="Attachment or picture (optional)"
            value={form.attachmentUrl}
            onChange={(next) => setForm({ ...form, attachmentUrl: next })}
            hint="Shown as a link on the notice."
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            Pin to the top of the list
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : editing ? (
                'Save changes'
              ) : (
                'Publish notice'
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={cancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading notices…
        </div>
      ) : notices.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No notices yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {notices.map((notice) => (
            <li
              key={notice.id}
              className="flex flex-wrap items-start gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {notice.pinned ? (
                    <Pin className="h-4 w-4 text-primary" aria-label="Pinned" />
                  ) : null}
                  <h3 className="font-semibold">{notice.title}</h3>
                  <Badge variant="outline">{notice.category}</Badge>
                  {notice.audience !== 'ALL' ? (
                    <Badge variant="outline">{notice.audience.toLowerCase()}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {notice.body}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDateTime(notice.publishedAt)}
                  {notice.expiresAt ? ` · hides ${formatDateTime(notice.expiresAt)}` : ''}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(notice)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void remove(notice)}>
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  <span className="sr-only">Delete {notice.title}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
