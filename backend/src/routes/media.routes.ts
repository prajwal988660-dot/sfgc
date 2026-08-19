import { Router, type RequestHandler } from 'express'
import multer from 'multer'

import { asyncHandler } from '../lib/async'
import { badRequest, AppError } from '../lib/errors'
import { ok } from '../lib/respond'
import { authenticate, requirePermission } from '../middleware/auth'
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  isStorageConfigured,
  uploadImage,
} from '../lib/storage'

const router = Router()

/**
 * Files are buffered in memory, never written to disk. The API runs on Render's
 * free tier where the filesystem is ephemeral and shared with the running
 * process, and an 8 MB cap makes buffering cheaper than managing temp files.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(badRequest(`Unsupported image type: ${file.mimetype}`))
      return
    }
    cb(null, true)
  },
})

/**
 * Turns multer's own failures into the API's error vocabulary. Without this a
 * file over the limit surfaces as a raw MulterError and the generic 500
 * handler, which tells the admin nothing about what went wrong.
 */
const singleImage: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (error: unknown) => {
    if (!error) {
      next()
      return
    }
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? `Image is too large. The limit is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`
          : `Upload rejected: ${error.message}`
      next(badRequest(message))
      return
    }
    next(error)
  })
}

/**
 * GET /media/config — staff only.
 *
 * Lets the admin panel show a real explanation instead of a dead upload button
 * on an install where the storage secrets were never filled in.
 */
router.get(
  '/config',
  authenticate,
  requirePermission('media:upload'),
  asyncHandler(async (_req, res) => {
    return ok(res, {
      configured: isStorageConfigured(),
      maxBytes: MAX_UPLOAD_BYTES,
      allowedTypes: ALLOWED_MIME_TYPES,
    })
  }),
)

/**
 * POST /media/upload — staff only.
 *
 * Takes one image as multipart `file` and returns its public URL, which the
 * caller stores in `event.coverImage` or `notice.attachmentUrl`. Restricted to
 * staff: an open upload endpoint is free file hosting for anyone who finds it.
 */
router.post(
  '/upload',
  authenticate,
  requirePermission('media:upload'),
  singleImage,
  asyncHandler(async (req, res) => {
    if (!isStorageConfigured()) {
      throw new AppError(
        'INTERNAL_ERROR',
        'Image upload is not configured on this server. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      )
    }

    const file = req.file
    if (!file) {
      throw badRequest('Choose an image to upload.')
    }

    const result = await uploadImage(file.buffer, file.originalname, file.mimetype)
    return ok(res, result, 201)
  }),
)

export default router
