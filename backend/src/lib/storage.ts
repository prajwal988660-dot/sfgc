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

// ------------------------------------------------- admission documents ----

/**
 * Types accepted for an admission document.
 *
 * PDF is here and not in ALLOWED_TYPES above, because a marks card is usually a
 * PDF while an event cover never is. SVG is deliberately absent from both: an
 * SVG is a script container, and one served from the storage origin executes
 * there.
 */
const ADMISSION_TYPES: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
}

export const ALLOWED_ADMISSION_MIME_TYPES = Object.keys(ADMISSION_TYPES)

/** 4 MB per document, and no more than five per application. */
export const MAX_ADMISSION_BYTES = 4 * 1024 * 1024
export const MAX_ADMISSION_FILES = 5
/** Whole-application ceiling: five 4 MB files would otherwise be 20 MB. */
export const MAX_ADMISSION_TOTAL_BYTES = 10 * 1024 * 1024

/**
 * The first bytes of a file, checked against what the caller claimed it is.
 *
 * `file.mimetype` from multer is copied verbatim out of the uploader's own
 * multipart header — it is a claim, not a fact, and any file at all can claim
 * to be a PNG. Without this the type allow-list checks nothing: it filters the
 * label rather than the contents, and an HTML page or a script lands in storage
 * under a .png name.
 */
export function sniffedTypeMatches(buffer: Buffer, declared: string): boolean {
  const startsWith = (...bytes: number[]) =>
    bytes.every((byte, index) => buffer[index] === byte)

  switch (declared) {
    case 'image/jpeg':
      return startsWith(0xff, 0xd8, 0xff)
    case 'image/png':
      return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
    case 'application/pdf':
      return startsWith(0x25, 0x50, 0x44, 0x46) // "%PDF"
    case 'image/webp':
      // "RIFF" .... "WEBP" — the size field sits between the two markers.
      return (
        startsWith(0x52, 0x49, 0x46, 0x46) &&
        buffer.length > 11 &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      )
    default:
      return false
  }
}

/**
 * Whether admission documents can be stored.
 *
 * Separate from `isStorageConfigured()` and deliberately NOT falling back to
 * the media bucket. That bucket is public by design; an identity document
 * belonging to a sixteen-year-old must never land in it, and a fallback is
 * exactly how that happens — quietly, on the one deployment where the variable
 * was forgotten.
 */
export function isAdmissionStorageConfigured(): boolean {
  return Boolean(
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_ADMISSIONS_BUCKET,
  )
}

export interface StoredDocument {
  /** Object path inside the private bucket. NEVER a URL. */
  path: string
  size: number
  contentType: string
}

/**
 * Stores one admission document in the PRIVATE bucket.
 *
 * Returns the object path and nothing else. There is no public URL to return
 * and none is generated: the office reads these through a signed link created
 * at the moment of viewing, which expires. Handing a URL back to the submitter
 * would also turn this endpoint into anonymous file hosting on the college's
 * own infrastructure.
 */
export async function uploadAdmissionDocument(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  applicationNo: string,
): Promise<StoredDocument> {
  if (!isAdmissionStorageConfigured()) {
    throw new Error('Admission document storage is not configured')
  }
  if (!sniffedTypeMatches(buffer, mimeType)) {
    throw new Error(`That file is not a valid ${mimeType}`)
  }

  const supabase = getClient()
  const bucket = env.SUPABASE_ADMISSIONS_BUCKET as string

  const extension = ADMISSION_TYPES[mimeType] ?? '.bin'
  const unique = randomBytes(8).toString('hex')
  // Foldered by application so the office can find everything for one
  // applicant, and so a stray object is traceable. The applicant's own
  // filename never appears in the path — see objectName above for why.
  const path = `${applicationNo}/${unique}${extension}`

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  })
  if (error) throw new Error(`Upload failed: ${error.message}`)

  return { path, size: buffer.byteLength, contentType: mimeType }
}

/**
 * A short-lived link to one stored document, for a member of staff who is
 * looking at the application right now.
 *
 * Ten minutes: long enough to open and read, short enough that a link pasted
 * into a chat or left in a browser history stops working quickly.
 */
export async function signedDocumentUrl(path: string, expiresInSeconds = 600) {
  if (!isAdmissionStorageConfigured()) return null
  const supabase = getClient()
  const { data, error } = await supabase.storage
    .from(env.SUPABASE_ADMISSIONS_BUCKET as string)
    .createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data.signedUrl
}

/**
 * Removes stored objects. Used when a row could not be written after its files
 * were uploaded, so storage does not accumulate files no record points at.
 */
export async function removeAdmissionDocuments(paths: string[]): Promise<void> {
  if (paths.length === 0 || !isAdmissionStorageConfigured()) return
  const supabase = getClient()
  await supabase.storage.from(env.SUPABASE_ADMISSIONS_BUCKET as string).remove(paths)
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
