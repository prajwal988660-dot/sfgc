import { Router, type RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import type { Prisma } from '@prisma/client'

import { env } from '../config/env'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { AppError, badRequest, notFound, unauthenticated } from '../lib/errors'
import { ok, created, paginated, readPagination, buildMeta } from '../lib/respond'
import { authenticate, requirePermission } from '../middleware/auth'
import { validateBody, validateQuery, parsedQuery } from '../middleware/validate'
import {
  ALLOWED_ADMISSION_MIME_TYPES,
  MAX_ADMISSION_BYTES,
  MAX_ADMISSION_FILES,
  MAX_ADMISSION_TOTAL_BYTES,
  isAdmissionStorageConfigured,
  removeAdmissionDocuments,
  signedDocumentUrl,
  uploadAdmissionDocument,
} from '../lib/storage'
import {
  admissionDocumentKindSchema,
  createAdmissionSchema,
  listAdmissionsQuerySchema,
  reviewAdmissionSchema,
} from '../validators/admissions.schema'
import type {
  CreateAdmissionInput,
  ListAdmissionsQuery,
  ReviewAdmissionInput,
} from '../validators/admissions.schema'

/**
 * Admission applications.
 *
 * POST / is the ONLY endpoint in this API that an unauthenticated member of the
 * public can write to, and the only one that accepts uploads. Nearly everything
 * unusual in this file follows from that.
 */
const router = Router()

// ------------------------------------------------------------- limiters ----

/**
 * Per submitter. Applying to a college is something a person does once or
 * twice, not fifty times, so this can be far tighter than the API-wide limiter
 * (600 per 15 minutes) that would otherwise be the only thing in the way.
 */
const perIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.isProduction ? 5 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        'RATE_LIMITED',
        'Too many applications from this device. If you need to correct something, please phone the admissions office.',
      ),
    )
  },
})

/**
 * A ceiling on the ENDPOINT, not on one submitter.
 *
 * `trust proxy 1` is correct for Render, so per-IP limits are honest — but they
 * bound one source, and a botnet is many sources. This caps the whole route
 * regardless of who is calling, so the worst case for storage and database
 * growth is knowable. Sized well above a real intake day: a few thousand
 * applicants spread over weeks never approach 200 an hour.
 */
const globalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.isProduction ? 200 : 100_000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: () => 'admissions-global',
  handler: (_req, _res, next) => {
    next(
      new AppError(
        'RATE_LIMITED',
        'The admissions form is busy right now. Please try again shortly.',
      ),
    )
  },
})

// ------------------------------------------------------------ uploading ----

/**
 * Every limit is set explicitly.
 *
 * multer's defaults for the ones normally left out are `fields: Infinity`,
 * `parts: Infinity` and `fieldSize: 1 MB` EACH. Because multipart has to be
 * parsed before any schema can look at it, a request with twenty thousand tiny
 * text parts and no files at all is accumulated into memory in full before
 * validation exists to reject it — enough to exhaust a 512 MB instance shared
 * with Postgres's client, taking the whole API down with it. `parts` is the
 * number that bounds the request whatever shape it takes.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_ADMISSION_BYTES,
    files: MAX_ADMISSION_FILES,
    parts: 30,
    fields: 24,
    fieldSize: 8 * 1024,
    fieldNameSize: 64,
    headerPairs: 40,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_ADMISSION_MIME_TYPES.includes(file.mimetype)) {
      cb(badRequest(`${file.mimetype} files are not accepted. Send a JPG, PNG or PDF.`))
      return
    }
    cb(null, true)
  },
})

const acceptDocuments: RequestHandler = (req, res, next) => {
  // A JSON body is fine — documents are optional. Anything else is rejected
  // before multer allocates anything.
  if (!req.is('multipart/form-data')) {
    next()
    return
  }
  upload.array('documents', MAX_ADMISSION_FILES)(req, res, (error: unknown) => {
    if (!error) {
      next()
      return
    }
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? `Each document must be under ${Math.round(MAX_ADMISSION_BYTES / 1024 / 1024)} MB.`
          : error.code === 'LIMIT_FILE_COUNT'
            ? `Attach at most ${MAX_ADMISSION_FILES} documents.`
            : `Upload rejected: ${error.message}`
      next(badRequest(message))
      return
    }
    next(error)
  })
}

// ------------------------------------------------------------- helpers ----

/**
 * The next application number for this year, atomically.
 *
 * One statement: insert the year's counter or bump it, and read the result. No
 * scan, no read-then-write, so it costs the same whether the table holds ten
 * rows or ten million, and two simultaneous submissions cannot be handed the
 * same number.
 */
async function nextApplicationNo(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear()
  const rows = await tx.$queryRaw<{ seq: number }[]>`
    INSERT INTO "admission_counters" ("year", "seq") VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "seq" = "admission_counters"."seq" + 1
    RETURNING "seq"
  `
  const seq = rows[0]?.seq ?? 1
  return `ADM${String(year % 100).padStart(2, '0')}-${String(seq).padStart(4, '0')}`
}

/** What staff see in a list. Deliberately excludes reviewNotes. */
const admissionListSelect = {
  id: true,
  applicationNo: true,
  name: true,
  email: true,
  phone: true,
  programmeName: true,
  status: true,
  createdAt: true,
  stream: { select: { id: true, code: true, name: true } },
  _count: { select: { documents: true } },
} as const

/**
 * The full record, for one application.
 *
 * `reviewNotes` appears here and NOT in the list shape, and both are defined
 * next to each other so the difference is visible. The notes are the office's
 * private assessment of a named person; a select spread carelessly is all it
 * would take to put them somewhere they should not be.
 */
const admissionDetailSelect = {
  ...admissionListSelect,
  dateOfBirth: true,
  address: true,
  guardianName: true,
  guardianPhone: true,
  qualifyingExam: true,
  boardUniversity: true,
  yearOfPassing: true,
  marksObtained: true,
  reviewNotes: true,
  decidedAt: true,
  reviewedBy: { select: { id: true, name: true } },
  documents: {
    select: { id: true, kind: true, fileName: true, fileSize: true, fileUrl: true },
  },
} as const

// -------------------------------------------------------------- public ----

/**
 * POST /admissions — ANONYMOUS.
 *
 * Accepts an application and, optionally, up to five documents. Returns the
 * application number and nothing else: not the document URLs, not the row id.
 * Handing back a storage URL would make this endpoint usable as anonymous file
 * hosting on the college's own infrastructure, which is the point of storing
 * documents in a private bucket in the first place.
 */
router.post(
  '/',
  globalLimiter,
  perIpLimiter,
  acceptDocuments,
  validateBody(createAdmissionSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as CreateAdmissionInput
    const files = (req.files as Express.Multer.File[] | undefined) ?? []

    if (files.length > 0 && !isAdmissionStorageConfigured()) {
      throw new AppError(
        'INTERNAL_ERROR',
        'Document upload is not available at the moment. Please submit the form without attachments and bring your documents to the office.',
      )
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
    if (totalBytes > MAX_ADMISSION_TOTAL_BYTES) {
      throw badRequest(
        `Your documents total ${(totalBytes / 1024 / 1024).toFixed(1)} MB. The limit is ${Math.round(
          MAX_ADMISSION_TOTAL_BYTES / 1024 / 1024,
        )} MB altogether.`,
      )
    }

    // The stream is resolved before anything is written, so a bad id fails
    // without having uploaded a thing.
    if (body.streamId) {
      const stream = await prisma.stream.findUnique({ where: { id: body.streamId } })
      if (!stream) throw badRequest('That programme is not one we offer.')
    }

    // The number is reserved in its own short transaction. Uploads happen
    // OUTSIDE any transaction: a Supabase round-trip inside one would hold the
    // pooled connection — of which there is one — for the whole upload, and
    // every other request in the API would queue behind a stranger's file.
    const applicationNo = await prisma.$transaction((tx) => nextApplicationNo(tx))

    const storedPaths: string[] = []
    try {
      const documents: { kind: 'OTHER'; fileUrl: string; fileName: string; fileSize: number }[] =
        []

      for (const file of files) {
        const stored = await uploadAdmissionDocument(
          file.buffer,
          file.originalname,
          file.mimetype,
          applicationNo,
        )
        storedPaths.push(stored.path)
        documents.push({
          kind: 'OTHER',
          // The object PATH, not a URL. Staff get a signed link at view time.
          fileUrl: stored.path,
          // Truncated: originalname comes straight from the uploader's own
          // multipart header and is otherwise unbounded.
          fileName: file.originalname.slice(0, 120),
          fileSize: file.size,
        })
      }

      await prisma.admission.create({
        data: {
          applicationNo,
          name: body.name,
          email: body.email,
          phone: body.phone,
          dateOfBirth: body.dateOfBirth ? new Date(`${body.dateOfBirth}T00:00:00Z`) : null,
          address: body.address ?? null,
          guardianName: body.guardianName ?? null,
          guardianPhone: body.guardianPhone ?? null,
          streamId: body.streamId ?? null,
          programmeName: body.programmeName,
          qualifyingExam: body.qualifyingExam ?? null,
          boardUniversity: body.boardUniversity ?? null,
          yearOfPassing: body.yearOfPassing ?? null,
          marksObtained: body.marksObtained ?? null,
          documents: { create: documents },
        },
        select: { id: true },
      })
    } catch (error) {
      // The row failed after the files landed. Remove them, or storage
      // accumulates objects nothing points at — invisible to every audit and
      // to any future deletion request.
      await removeAdmissionDocuments(storedPaths).catch(() => undefined)
      throw error
    }

    return created(res, {
      applicationNo,
      message:
        'Your application has been received. Please quote this number when you contact the admissions office.',
    })
  }),
)

// --------------------------------------------------------------- staff ----

router.get(
  '/',
  authenticate,
  requirePermission('admissions:read'),
  validateQuery(listAdmissionsQuerySchema),
  asyncHandler(async (_req, res) => {
    const query = parsedQuery<typeof listAdmissionsQuerySchema>(res) as ListAdmissionsQuery
    const { page, limit, skip } = readPagination({ page: query.page, limit: query.limit }, 25)

    const where: Prisma.AdmissionWhereInput = {}
    if (query.status) where.status = query.status
    if (query.streamId) where.streamId = query.streamId
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
        { applicationNo: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q } },
      ]
    }

    const [rows, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        select: admissionListSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.admission.count({ where }),
    ])

    return paginated(
      res,
      rows.map(({ _count, ...row }) => ({ ...row, documentCount: _count.documents })),
      buildMeta(page, limit, total),
    )
  }),
)

router.get(
  '/:id',
  authenticate,
  requirePermission('admissions:read'),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Application')

    const row = await prisma.admission.findUnique({
      where: { id },
      select: admissionDetailSelect,
    })
    if (!row) throw notFound('Application')

    // Documents are stored privately. Each one gets a link that works for ten
    // minutes — long enough to read, short enough that a URL pasted into a
    // chat or left in a browser history stops working.
    const documents = await Promise.all(
      row.documents.map(async (doc) => ({
        ...doc,
        fileUrl: await signedDocumentUrl(doc.fileUrl),
      })),
    )

    const { _count, ...rest } = row
    return ok(res, { ...rest, documentCount: _count.documents, documents })
  }),
)

router.patch(
  '/:id',
  authenticate,
  requirePermission('admissions:manage'),
  validateBody(reviewAdmissionSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Application')
    const user = req.user
    if (!user) throw unauthenticated()
    const body = req.body as ReviewAdmissionInput

    const existing = await prisma.admission.findUnique({ where: { id } })
    if (!existing) throw notFound('Application')

    /** Statuses that represent a final decision, and so stamp decidedAt. */
    const DECIDED = new Set(['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ENROLLED'])

    const row = await prisma.admission.update({
      where: { id },
      data: {
        ...(body.status === undefined ? {} : { status: body.status }),
        ...(body.reviewNotes === undefined ? {} : { reviewNotes: body.reviewNotes }),
        reviewedById: user.id,
        ...(body.status && DECIDED.has(body.status) ? { decidedAt: new Date() } : {}),
      },
      select: admissionListSelect,
    })

    const { _count, ...rest } = row
    return ok(res, { ...rest, documentCount: _count.documents })
  }),
)

export default router
