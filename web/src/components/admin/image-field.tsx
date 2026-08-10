'use client'

import * as React from 'react'
import { AlertCircle, ImagePlus, Loader2, X } from 'lucide-react'

import type { MediaConfig } from '@sfgc/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { browserApi, errorMessage } from '@/lib/api'

/**
 * Picture picker used by both editors.
 *
 * Uploading and pasting a URL both end at the same place — a string in
 * `coverImage` or `attachmentUrl` — so the field offers both. If the server
 * has no storage configured the upload button explains that instead of
 * failing, and pasting still works, which keeps the panel usable before the
 * Supabase secrets are filled in.
 */
export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  hint?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [config, setConfig] = React.useState<MediaConfig | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await browserApi.media.config()
        if (!cancelled) setConfig(result)
      } catch {
        // Leaving config null only removes the upfront warning; an attempted
        // upload still reports whatever the server says.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Clear immediately so picking the same file twice still fires onChange.
    event.target.value = ''
    if (!file) return

    if (config && file.size > config.maxBytes) {
      setError(
        `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${Math.round(
          config.maxBytes / 1024 / 1024,
        )} MB.`,
      )
      return
    }

    setError(null)
    setUploading(true)
    try {
      const uploaded = await browserApi.media.upload(file, file.name)
      onChange(uploaded.url)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setUploading(false)
    }
  }

  const uploadDisabled = uploading || config?.configured === false

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={config?.allowedTypes?.join(',') ?? 'image/*'}
          onChange={handleFile}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploadDisabled}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Upload picture
            </>
          )}
        </Button>

        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
            <X className="h-4 w-4" aria-hidden="true" />
            Remove
          </Button>
        ) : null}
      </div>

      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="…or paste an image URL"
        inputMode="url"
        spellCheck={false}
      />

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      {config?.configured === false ? (
        <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Uploads are not set up on the server yet, so the button is disabled.
          Pasting an image URL works in the meantime.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {value ? (
        // A plain <img>: the URL can point at any host, and next/image would
        // need every one of them whitelisted in next.config.mjs first.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="max-h-44 w-full rounded-lg border border-border object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
          onLoad={(event) => {
            event.currentTarget.style.display = ''
          }}
        />
      ) : null}
    </div>
  )
}
