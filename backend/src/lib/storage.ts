import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import path from 'node:path'

import { env } from '../config/env'

/**
 * Image storage for the admin panel, backed by the Storage side of the same
 * Supabase project that holds the database.
 *
 * Uploads go through the API rather than straight from the browser, so the
 * service role key never leaves the server. That key bypasses row-level
 * security entirely — handing it to a client would give every visitor write
 * access to the whole project.
 */

/** Bitmap formats a browser will render in an <img>, and nothing else. */
const ALLOWED_TYPES: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
}

/**
 * 8 MB. Large enough for a photo straight off a phone, small enough that a
 * slow college connection is not stuck uploading for minutes.
 */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export const ALLOWED_MIME_TYPES = Object.keys(ALLOWED_TYPES)

let client: SupabaseClient | null = null

/**
 * Whether uploads can work at all. The two secrets are set in the Render
 * dashboard; until they are, the route says so plainly instead of failing with
 * an opaque error from deep inside the storage SDK.
 */
export function isStorageConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)
}

function getClient(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase storage is not configured')
  }
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

/**
 * Builds the stored object name.
 *
 * The original filename is never reused as the key. Two people uploading
 * "poster.jpg" would otherwise overwrite each other, and a crafted name can
 * escape the intended folder. What survives is a slug of the original stem,
 * kept only so the file is recognisable in the Supabase dashboard.
 */
function objectName(originalName: string, mimeType: string): string {
  const extension = ALLOWED_TYPES[mimeType] ?? '.bin'
  const stem = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const unique = randomBytes(8).toString('hex')
  return stem ? `${stem}-${unique}${extension}` : `upload-${unique}${extension}`
}

export interface UploadedFile {
  url: string
  path: string
  size: number
  contentType: string
}

/**
 * Stores one image and returns its public URL.
 *
 * The bucket is expected to be public: these are event covers and notice
 * attachments that appear on a website with no login, so signed URLs would
 * expire and break the page.
 */
export async function uploadImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<UploadedFile> {
  const supabase = getClient()
  const bucket = env.SUPABASE_MEDIA_BUCKET
  const name = objectName(originalName, mimeType)

  const { error } = await supabase.storage.from(bucket).upload(name, buffer, {
    contentType: mimeType,
    // A fresh random name per upload means a collision is a bug, not something
    // to paper over by overwriting someone else's file.
    upsert: false,
  })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(name)

  return {
    url: data.publicUrl,
    path: name,
    size: buffer.byteLength,
    contentType: mimeType,
  }
}
