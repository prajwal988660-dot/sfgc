'use client'

import * as React from 'react'
import { BookOpen, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { MaterialKind, Stream, StudyMaterial } from '@sfgc/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { browserApi, errorMessage } from '@/lib/api'

import { ImageField } from './image-field'

const KINDS: ReadonlyArray<{ value: MaterialKind; label: string }> = [
  { value: 'NOTES', label: 'Notes' },
  { value: 'QUESTION_PAPER', label: 'Question paper' },
  { value: 'SOLVED_PAPER', label: 'Solved paper' },
  { value: 'SYLLABUS', label: 'Syllabus' },
  { value: 'REFERENCE', label: 'Reference' },
]

const KIND_LABEL = new Map(KINDS.map((kind) => [kind.value, kind.label]))

/**
 * The library students read in the app.
 *
 * Scope is deliberately loose: leaving the stream blank publishes to the whole
 * college, and leaving the semester blank publishes to the whole stream. Most
 * material is genuinely one of those two, and forcing a precise target would
 * mean uploading the same syllabus six times.
 */
export function LibraryManager() {
  const [materials, setMaterials] = React.useState<StudyMaterial[]>([])
  const [streams, setStreams] = React.useState<Stream[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [filterKind, setFilterKind] = React.useState<'' | MaterialKind>('')

  const [form, setForm] = React.useState({
    title: '',
    description: '',
    kind: 'NOTES' as MaterialKind,
    fileUrl: '',
    streamId: '',
    semester: '',
  })

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [{ items }, streamList] = await Promise.all([
        browserApi.materials.list({
          includeUnpublished: true,
          kind: filterKind || undefined,
          limit: 100,
        }),
        browserApi.streams.list(),
      ])
      setMaterials(items)
      setStreams(streamList)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [filterKind])

  React.useEffect(() => {
    void load()
  }, [load])

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!form.fileUrl.trim()) {
      toast.error('Upload a file or paste a link first.')
      return
    }

    setSaving(true)
    try {
      await browserApi.materials.create({
        title: form.title,
        description: form.description || null,
        kind: form.kind,
        fileUrl: form.fileUrl.trim(),
        streamId: form.streamId || null,
        semester: form.semester ? Number.parseInt(form.semester, 10) : null,
      })
      toast.success('Added to the library')
      setForm({
        title: '',
        description: '',
        kind: form.kind,
        fileUrl: '',
        streamId: form.streamId,
        semester: form.semester,
      })
      setOpen(false)
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function remove(material: StudyMaterial) {
    if (!window.confirm(`Remove "${material.title}" from the library?`)) return
    try {
      await browserApi.materials.remove(material.id)
      toast.success('Removed')
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
  }

  function scopeOf(material: StudyMaterial): string {
    if (!material.stream) return 'Whole college'
    const stream = material.stream.shortName ?? material.stream.code
    return material.semester ? `${stream} · Semester ${material.semester}` : stream
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Notes, question papers and solved papers for the student app.
          </p>
        </div>
        {!open ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add material
          </Button>
        ) : null}
      </div>

      {open ? (
        <form
          onSubmit={create}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg font-semibold">New material</h2>

          <div className="space-y-2">
            <Label htmlFor="lm-title">Title</Label>
            <Input
              id="lm-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="DBMS — Unit 3 notes"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lm-desc">Description (optional)</Label>
            <Textarea
              id="lm-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="lm-kind">Type</Label>
              <select
                id="lm-kind"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as MaterialKind })}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {KINDS.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lm-stream">Stream</Label>
              <select
                id="lm-stream"
                value={form.streamId}
                onChange={(e) => setForm({ ...form, streamId: e.target.value })}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Everyone</option>
                {streams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lm-sem">Semester</Label>
              <Input
                id="lm-sem"
                type="number"
                min={1}
                max={12}
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                placeholder="All"
              />
            </div>
          </div>

          <ImageField
            label="File"
            value={form.fileUrl}
            onChange={(next) => setForm({ ...form, fileUrl: next })}
            hint="Upload a PDF or image, or paste a link to one."
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                'Add to library'
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterKind === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterKind('')}
        >
          All
        </Button>
        {KINDS.map((kind) => (
          <Button
            key={kind.value}
            variant={filterKind === kind.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterKind(kind.value)}
          >
            {kind.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading library…
        </div>
      ) : materials.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-3 h-8 w-8 opacity-40" aria-hidden="true" />
          Nothing here yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {materials.map((material) => (
            <li
              key={material.id}
              className="flex flex-wrap items-start gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{material.title}</h3>
                  <Badge variant="outline">
                    {KIND_LABEL.get(material.kind) ?? material.kind}
                  </Badge>
                  {!material.isPublished ? <Badge variant="outline">Hidden</Badge> : null}
                </div>
                {material.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {material.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">{scopeOf(material)}</p>
              </div>

              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={material.fileUrl} target="_blank" rel="noreferrer noopener">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Open
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void remove(material)}>
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  <span className="sr-only">Remove {material.title}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
