'use client'

import * as React from 'react'
import { Eye, EyeOff, Images, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { GalleryAlbum, GalleryImage } from '@sfgc/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { browserApi, errorMessage } from '@/lib/api'

import { ImageField } from './image-field'

/**
 * The photo gallery shown on the public site.
 *
 * Albums are free text rather than a fixed list, because the ones a college
 * wants — "Sambhram 2026", "NSS Camp" — are editorial and change every year.
 * The album picker is populated from albums already in use, so the common case
 * is choosing an existing one and the uncommon case is still possible.
 */
export function GalleryManager() {
  const [images, setImages] = React.useState<GalleryImage[]>([])
  const [albums, setAlbums] = React.useState<GalleryAlbum[]>([])
  const [filterAlbum, setFilterAlbum] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const [form, setForm] = React.useState({
    title: '',
    caption: '',
    altText: '',
    album: 'Campus',
    imageUrl: '',
  })

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [{ items }, albumList] = await Promise.all([
        // Staff see drafts too; a visitor never does, whatever is asked for.
        browserApi.gallery.list({
          includeUnpublished: true,
          album: filterAlbum || undefined,
          limit: 100,
        }),
        browserApi.gallery.albums(),
      ])
      setImages(items)
      setAlbums(albumList)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [filterAlbum])

  React.useEffect(() => {
    void load()
  }, [load])

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!form.imageUrl.trim()) {
      toast.error('Upload a picture or paste a link first.')
      return
    }

    setSaving(true)
    try {
      await browserApi.gallery.create({
        title: form.title,
        caption: form.caption || null,
        altText: form.altText || null,
        album: form.album.trim() || 'Campus',
        imageUrl: form.imageUrl.trim(),
      })
      toast.success('Added to the gallery')
      // The album is kept: adding a batch of photographs from one event is the
      // normal case, and re-picking it every time would be tedious.
      setForm({ title: '', caption: '', altText: '', album: form.album, imageUrl: '' })
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  async function togglePublished(image: GalleryImage) {
    try {
      await browserApi.gallery.update(image.id, { isPublished: !image.isPublished })
      toast.success(image.isPublished ? 'Hidden from the site' : 'Now visible on the site')
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
  }

  async function remove(image: GalleryImage) {
    if (!window.confirm(`Remove "${image.title}" from the gallery?`)) return
    try {
      await browserApi.gallery.remove(image.id)
      toast.success('Removed')
      await load()
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Gallery</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Photographs shown on the public website.
          </p>
        </div>
        {!open ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add pictures
          </Button>
        ) : null}
      </div>

      {open ? (
        <form
          onSubmit={create}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-display text-lg font-semibold">New picture</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gl-title">Title</Label>
              <Input
                id="gl-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Annual Day 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gl-album">Album</Label>
              <Input
                id="gl-album"
                list="gallery-albums"
                value={form.album}
                onChange={(e) => setForm({ ...form, album: e.target.value })}
                placeholder="Campus"
              />
              <datalist id="gallery-albums">
                {albums.map((a) => (
                  <option key={a.album} value={a.album} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Pick an existing album or type a new one.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gl-caption">Caption (optional)</Label>
            <Textarea
              id="gl-caption"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gl-alt">Description for screen readers (optional)</Label>
            <Input
              id="gl-alt"
              value={form.altText}
              onChange={(e) => setForm({ ...form, altText: e.target.value })}
              placeholder="Students performing a classical dance on stage"
            />
            <p className="text-xs text-muted-foreground">
              Describes what is in the picture for someone who cannot see it. Left blank,
              the image is announced as decorative rather than given a misleading title.
            </p>
          </div>

          <ImageField
            label="Picture"
            value={form.imageUrl}
            onChange={(next) => setForm({ ...form, imageUrl: next })}
            hint="Upload a photograph, or paste a link to one."
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Adding…
                </>
              ) : (
                'Add to gallery'
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </form>
      ) : null}

      {albums.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterAlbum === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterAlbum('')}
          >
            All
          </Button>
          {albums.map((a) => (
            <Button
              key={a.album}
              variant={filterAlbum === a.album ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterAlbum(a.album)}
            >
              {a.album} ({a.count})
            </Button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading gallery…
        </div>
      ) : images.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <Images className="mx-auto mb-3 h-8 w-8 opacity-40" aria-hidden="true" />
          No pictures yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <li
              key={image.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              {/* A plain img: these URLs point at arbitrary hosts, and next/image
                  would need every one whitelisted in next.config.mjs first. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.imageUrl}
                alt={image.altText ?? ''}
                className="h-44 w-full bg-muted object-cover"
                loading="lazy"
              />
              <div className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{image.title}</h3>
                  <Badge variant="outline">{image.album}</Badge>
                  {!image.isPublished ? <Badge variant="outline">Hidden</Badge> : null}
                </div>
                {image.caption ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {image.caption}
                  </p>
                ) : null}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void togglePublished(image)}
                  >
                    {image.isPublished ? (
                      <>
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Show
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void remove(image)}>
                    <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                    <span className="sr-only">Remove {image.title}</span>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
