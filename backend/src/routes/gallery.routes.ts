import { Router } from 'express'
import type { Prisma } from '@prisma/client'

import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { notFound } from '../lib/errors'
import { ok, created, paginated, readPagination, buildMeta } from '../lib/respond'
import { authenticate, optionalAuth, requirePermission } from '../middleware/auth'
import { can } from '../auth/permissions'
import { validateBody, validateQuery, parsedQuery } from '../middleware/validate'
import {
  createGalleryImageSchema,
  listGalleryQuerySchema,
  updateGalleryImageSchema,
} from '../validators/gallery.schema'
import type {
  CreateGalleryImageInput,
  ListGalleryQuery,
  UpdateGalleryImageInput,
} from '../validators/gallery.schema'

/**
 * The photo gallery on the public website.
 *
 * Reads are open to anonymous visitors — this is a college's public photographs
 * and the site renders it without anyone signing in. Writes need `gallery:write`,
 * which content administrators and super admins hold and teachers do not: the
 * gallery is editorial, college-wide imagery rather than something each teacher
 * curates.
 */
const router = Router()

const gallerySelect = {
  id: true,
  title: true,
  caption: true,
  imageUrl: true,
  altText: true,
  album: true,
  sortOrder: true,
  isPublished: true,
  createdAt: true,
  uploadedBy: { select: { id: true, name: true } },
} as const

router.get(
  '/',
  // Anonymous is fine and expected; a signed-in staff member additionally gets
  // the option of seeing unpublished drafts.
  optionalAuth,
  validateQuery(listGalleryQuerySchema),
  asyncHandler(async (req, res) => {
    const query = parsedQuery<typeof listGalleryQuerySchema>(res) as ListGalleryQuery
    const { page, limit, skip } = readPagination({ page: query.page, limit: query.limit }, 60)

    const where: Prisma.GalleryImageWhereInput = {}

    // A visitor never sees a draft, whatever they pass.
    const mayseeDrafts = Boolean(req.user && can(req.user.role, 'gallery:write'))
    if (!(query.includeUnpublished && mayseeDrafts)) {
      where.isPublished = true
    }

    if (query.album) where.album = query.album
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { caption: { contains: query.q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.galleryImage.findMany({
        where,
        select: gallerySelect,
        // sortOrder is the editorial choice; createdAt breaks ties so an album
        // whose positions were all left at 0 still returns a stable order
        // rather than shuffling between requests.
        orderBy: [{ album: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.galleryImage.count({ where }),
    ])

    return paginated(res, items, buildMeta(page, limit, total))
  }),
)

/**
 * GET /gallery/albums — the album names in use, with a count each.
 *
 * Derived rather than stored: albums are just a column value, so the list of
 * them is whatever the images say it is. That keeps an empty album from
 * lingering in a picker after its last photograph is removed.
 */
router.get(
  '/albums',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const mayseeDrafts = Boolean(req.user && can(req.user.role, 'gallery:write'))

    const grouped = await prisma.galleryImage.groupBy({
      by: ['album'],
      where: mayseeDrafts ? {} : { isPublished: true },
      _count: { _all: true },
      orderBy: { album: 'asc' },
    })

    return ok(
      res,
      grouped.map((row) => ({ album: row.album, count: row._count._all })),
    )
  }),
)

router.post(
  '/',
  authenticate,
  requirePermission('gallery:write'),
  validateBody(createGalleryImageSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as CreateGalleryImageInput

    const image = await prisma.galleryImage.create({
      data: { ...body, uploadedById: req.user?.id },
      select: gallerySelect,
    })
    return created(res, image)
  }),
)

router.patch(
  '/:id',
  authenticate,
  requirePermission('gallery:write'),
  validateBody(updateGalleryImageSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Image')
    const body = req.body as UpdateGalleryImageInput

    const existing = await prisma.galleryImage.findUnique({ where: { id } })
    if (!existing) throw notFound('Image')

    const image = await prisma.galleryImage.update({
      where: { id },
      data: body,
      select: gallerySelect,
    })
    return ok(res, image)
  }),
)

router.delete(
  '/:id',
  authenticate,
  requirePermission('gallery:write'),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Image')

    const existing = await prisma.galleryImage.findUnique({ where: { id } })
    if (!existing) throw notFound('Image')

    // The row goes; the file stays in Supabase Storage. The same URL may have
    // been pasted into a notice or an event cover, and deleting the object
    // would break those silently.
    await prisma.galleryImage.delete({ where: { id } })
    return ok(res, { id })
  }),
)

export default router
