'use client'

import * as React from 'react'
import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

import type { Event } from '@sfgc/shared'
import { formatDateTime } from '@sfgc/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { browserApi, errorMessage } from '@/lib/api'

import { ImageField } from './image-field'

const CATEGORIES = ['Cultural', 'Technical', 'Sports', 'Workshop', 'Seminar', 'Placement']

interface FormState {
  title: string
  description: string
  category: string
  startsAt: string
  endsAt: string
  venue: string
  coverImage: string
  fee: string
  capacity: string
  organizer: string
  contactName: string
  contactEmail: string
  contactPhone: string
  registrationOpen: boolean
  isPublished: boolean
}

const EMPTY: FormState = {
  title: '',
  description: '',
  category: 'Cultural',
  startsAt: '',
  endsAt: '',
  venue: '',
  coverImage: '',
  fee: '0',
  capacity: '',
  organizer: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  registrationOpen: true,
  isPublished: true,
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function toForm(event: Event): FormState {
  return {
    title: event.title,
    description: event.description,
    category: event.category,
    startsAt: toLocalInput(event.startsAt),
    endsAt: toLocalInput(event.endsAt),
    venue: event.venue ?? '',
    coverImage: event.coverImage ?? '',
    fee: String(event.fee ?? 0),
    capacity: event.capacity === null ? '' : String(event.capacity),
    organizer: event.organizer ?? '',
    contactName: event.contactName ?? '',
    contactEmail: event.contactEmail ?? '',
    contactPhone: event.contactPhone ?? '',
    registrationOpen: event.registrationOpen,
    isPublished: event.isPublished,
  }
}

/** Blank optional text is sent as null so clearing a field actually clears it. */
function blankToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toInput(form: FormState): Partial<Event> {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category.trim() || 'Cultural',
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    venue: blankToNull(form.venue),
    coverImage: blankToNull(form.coverImage),
    fee: Number.parseInt(form.fee, 10) || 0,
    capacity: form.capacity.trim() ? Number.parseInt(form.capacity, 10) : null,
    organizer: blankToNull(form.organizer),
    contactName: blankToNull(form.contactName),
    contactEmail: blankToNull(form.contactEmail),
    contactPhone: blankToNull(form.contactPhone),
    registrationOpen: form.registrationOpen,
    isPublished: form.isPublished,
  } as Partial<Event>
}

export function EventsManager() {
  const [events, setEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editing, setEditing] = React.useState<Event | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(EMPTY)
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      // The panel must show drafts too, which the public listing hides. The
      // API only honours this for staff, so it is safe to always ask.
      const { items } = await browserApi.events.list({
        includeUnpublished: true,
        limit: 100,
      })
      setEvents(items)
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

  function startEdit(event: Event) {
    setCreating(false)
    setEditing(event)
    setForm(toForm(event))
  }

  function cancel() {
    setCreating(false)
    setEditing(null)
    setForm(EMPTY)
  }

  async function save(submitEvent: React.FormEvent) {
    submitEvent.preventDefault()
    if (saving) return

    if (!form.startsAt) {
      toast.error('Pick a start date and time.')
      return
    }

    setSaving(true)
    try {
      const input = toInput(form)
      if (editing) {
        await browserApi.events.update(editing.id, input)
        toast.success('Event updated')
      } else {
        await browserApi.events.create(input)
        toast.success('Event created')
      }
      cancel()
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function remove(event: Event) {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    try {
      await browserApi.events.remove(event.id)
      toast.success('Event deleted')
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
          <h1 className="font-display text-2xl font-semibold">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shown on the website’s events page and in the student app.
          </p>
        </div>
        {!open ? (
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New event
          </Button>
        ) : null}
      </div>

      {open ? (
        <form
          onSubmit={save}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg font-semibold">
            {editing ? 'Edit event' : 'New event'}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-description">Description</Label>
            <Textarea
              id="ev-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={5}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-starts">Starts</Label>
              <Input
                id="ev-starts"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-ends">Ends (optional)</Label>
              <Input
                id="ev-ends"
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-category">Category</Label>
              <Input
                id="ev-category"
                list="event-categories"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <datalist id="event-categories">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-venue">Venue</Label>
              <Input
                id="ev-venue"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-fee">Fee (₹)</Label>
              <Input
                id="ev-fee"
                type="number"
                min={0}
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">0 means free.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-capacity">Seats (optional)</Label>
              <Input
                id="ev-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Blank means unlimited.</p>
            </div>
          </div>

          <ImageField
            label="Cover picture"
            value={form.coverImage}
            onChange={(next) => setForm({ ...form, coverImage: next })}
            hint="Appears at the top of the event on the website."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-organizer">Organiser</Label>
              <Input
                id="ev-organizer"
                value={form.organizer}
                onChange={(e) => setForm({ ...form, organizer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-contact-name">Contact person</Label>
              <Input
                id="ev-contact-name"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-contact-email">Contact email</Label>
              <Input
                id="ev-contact-email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-contact-phone">Contact phone</Label>
              <Input
                id="ev-contact-phone"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              Visible on the website
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.registrationOpen}
                onChange={(e) => setForm({ ...form, registrationOpen: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              Accepting registrations
            </label>
          </div>

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
                'Create event'
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
          Loading events…
        </div>
      ) : events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No events yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-start gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{event.title}</h3>
                  <Badge variant="outline">{event.category}</Badge>
                  {event.isPublished ? (
                    <Badge variant="outline">
                      <Eye className="mr-1 h-3 w-3" aria-hidden="true" />
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <EyeOff className="mr-1 h-3 w-3" aria-hidden="true" />
                      Draft
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(event.startsAt)}
                  {event.venue ? ` · ${event.venue}` : ''}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {event.registrationCount} registered
                  {event.seatsLeft !== null ? ` · ${event.seatsLeft} seats left` : ''}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(event)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void remove(event)}>
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  <span className="sr-only">Delete {event.title}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
