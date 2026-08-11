import { Router } from 'express'
import type { Prisma } from '@prisma/client'

import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { notFound, unauthenticated } from '../lib/errors'
import { ok, created, paginated, readPagination, buildMeta } from '../lib/respond'
import { authenticate, requireRole } from '../middleware/auth'
import { validateBody, validateQuery, parsedQuery } from '../middleware/validate'
import {
  createMaterialSchema,
  listMaterialsQuerySchema,
  updateMaterialSchema,
} from '../validators/materials.schema'
import type {
  CreateMaterialInput,
  ListMaterialsQuery,
  UpdateMaterialInput,
} from '../validators/materials.schema'

/**
 * The library: notes, question papers and solved papers that students read in
 * the app. Staff upload the file through /api/media/upload and post the
 * resulting link here.
 */
const router = Router()

const materialSelect = {
  id: true,
  title: true,
  description: true,
  kind: true,
  fileUrl: true,
  fileLabel: true,
  semester: true,
  isPublished: true,
  createdAt: true,
  streamId: true,
  subjectId: true,
  stream: { select: { id: true, code: true, name: true, shortName: true } },
  subject: { select: { id: true, code: true, name: true } },
  uploadedBy: { select: { id: true, name: true } },
} as const

const isStaff = (role: string | undefined) => role === 'ADMIN' || role === 'TEACHER'

router.get(
  '/',
  authenticate,
  validateQuery(listMaterialsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = parsedQuery<typeof listMaterialsQuerySchema>(res) as ListMaterialsQuery
    const { page, limit, skip } = readPagination({ page: query.page, limit: query.limit }, 50)

    const where: Prisma.StudyMaterialWhereInput = {}

    // A student never sees an unpublished draft, whatever they ask for.
    if (!(query.includeUnpublished && isStaff(req.user?.role))) {
      where.isPublished = true
    }

    if (query.streamId) where.streamId = query.streamId
    if (query.subjectId) where.subjectId = query.subjectId
    if (query.kind) where.kind = query.kind
    if (query.semester !== undefined) where.semester = query.semester
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.studyMaterial.findMany({
        where,
        select: materialSelect,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.studyMaterial.count({ where }),
    ])

    return paginated(res, items, buildMeta(page, limit, total))
  }),
)

/**
 * What the signed-in student's own course offers.
 *
 * Their stream and semester come from their account rather than the query, so
 * the app opens on the right shelf without having to ask. College-wide
 * material — anything with no stream set — is always included.
 */
router.get(
  '/mine',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) throw unauthenticated('Sign in to continue.')

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { streamId: true, semester: true },
    })

    const scopes: Prisma.StudyMaterialWhereInput[] = [{ streamId: null }]
    if (account?.streamId) {
      scopes.push({
        streamId: account.streamId,
        // Either aimed at their semester specifically, or at the whole stream.
        OR: [{ semester: account.semester ?? undefined }, { semester: null }],
      })
    }

    const items = await prisma.studyMaterial.findMany({
      where: { isPublished: true, OR: scopes },
      select: materialSelect,
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    })

    return ok(res, items)
  }),
)

router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'TEACHER'),
  validateBody(createMaterialSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as CreateMaterialInput

    const material = await prisma.studyMaterial.create({
      data: { ...body, uploadedById: req.user?.id },
      select: materialSelect,
    })
    return created(res, material)
  }),
)

router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'TEACHER'),
  validateBody(updateMaterialSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Material')
    const body = req.body as UpdateMaterialInput

    const existing = await prisma.studyMaterial.findUnique({ where: { id } })
    if (!existing) throw notFound('Material')

    const material = await prisma.studyMaterial.update({
      where: { id },
      data: body,
      select: materialSelect,
    })
    return ok(res, material)
  }),
)

router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'TEACHER'),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Material')

    const existing = await prisma.studyMaterial.findUnique({ where: { id } })
    if (!existing) throw notFound('Material')

    // Only the row goes. The file stays in Supabase Storage, because the same
    // link may well have been pasted into a notice or another material.
    await prisma.studyMaterial.delete({ where: { id } })
    return ok(res, { id })
  }),
)

export default router
