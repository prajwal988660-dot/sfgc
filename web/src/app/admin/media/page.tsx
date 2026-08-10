'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { AdminGuard } from '@/components/admin/admin-guard'
import { ImageField } from '@/components/admin/image-field'

/**
 * Standalone uploader.
 *
 * The notice and event editors upload inline, so this page exists for the case
 * with no form attached to it: getting a link for a picture to use somewhere
 * else. It deliberately keeps no library of past uploads — listing the bucket
 * would need a second endpoint, and Supabase's own dashboard already does it.
 */
function MediaUploader() {
  const [url, setUrl] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.')
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Pictures</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an image to get a link you can paste into a notice or an event.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <ImageField label="Picture" value={url} onChange={setUrl} />

        {url ? (
          <Button type="button" variant="outline" className="mt-5" onClick={() => void copy()}>
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy link
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default function AdminMediaPage() {
  return <AdminGuard>{() => <MediaUploader />}</AdminGuard>
}
