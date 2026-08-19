import { Router, type Request } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { ok, created, paginated, readPagination, buildMeta } from '../lib/respond'
import { forbidden, notFound, unauthenticated } from '../lib/errors'
import { authenticate, optionalAuth, requirePermission, type AuthUser } from '../middleware/auth'
import { can } from '../auth/permissions'
import { canModifyNotice } from '../auth/ownership'
import { validateBody, validateQuery, parsedQuery } from '../middleware/validate'
import { notifyNotice } from '../services/push'
import {
  createNoticeSchema,
  listNoticesQuerySchema,
  updateNoticeSchema,
  type CreateNoticeInput,
  type UpdateNoticeInput,
} from '../validators/notices.schema'

const router = Router()

const noticeSelect = Prisma.validator<Prisma.NoticeSelect>()({
  id: true,
  title: true,
  body: true,
  category: true,
  audience: true,
  pinned: true,
  attachmentUrl: true,
  program: true,
  semester: true,
  publishedAt: true,
  expiresAt: true,
  authorId: true,
  author: { select: { id: true, name: true, role: true } },
})

type NoticeRow = Prisma.NoticeGetPayload<{ select: typeof noticeSelect }>

/** `authorId` is loaded for the permission check but is not part of the contract. */
function serializeNotice(notice: NoticeRow) {
  return {
    id: notice.id,
    title: notice.title,
    body: notice.body,
    category: notice.category,
    audience: notice.audience,
    pinned: notice.pinned,
    attachmentUrl: notice.attachmentUrl,
    program: notice.program,
    semester: notice.semester,
    publishedAt: notice.publishedAt.toISOString(),
    expiresAt: notice.expiresAt?.toISOString() ?? null,
    author: {
      id: notice.author.id,
      name: notice.author.name,
      role: notice.author.role,
    },
  }
}

function requireUser(req: Request): AuthUser {
  if (!req.user) throw unauthenticated('Sign in to continue.')
  return req.user
}

function readId(req: Request): string {
  const id = req.params.id
  if (!id) throw notFound('Notice')
  return id
}

/**
 * The audience filter, as SQL. Signed-out callers see `ALL` only; students
 * additionally see `STUDENTS` but a notice that names a program or semester
 * only reaches the students it names; teachers see `TEACHERS`; admins see
 * everything. Expired notices are never listed.
 */
function visibilityClauses(user: AuthUser | undefined): Prisma.NoticeWhereInput[] {
  const clauses: Prisma.NoticeWhereInput[] = [
    { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
  ]

  if (user && can(user.role, 'notices:moderate')) return clauses

  if (user?.role === 'TEACHER') {
    clauses.push({ audience: { in: ['ALL', 'TEACHERS'] } })
    return clauses
  }

  if (user?.role === 'STUDENT') {
    clauses.push({ audience: { in: ['ALL', 'STUDENTS'] } })
    clauses.push({ OR: [{ program: null }, { program: user.program }] })
    clauses.push({ OR: [{ semester: null }, { semester: user.semester }] })
    return clauses
  }

  // Signed out, or a role we do not know yet: fail closed to public notices.
  clauses.push({ audience: 'ALL' })
  return clauses
}

/** The same rules as `visibilityClauses`, applied to a row already in memory. */
function canView(notice: NoticeRow, user: AuthUser | undefined): boolean {
  if (user && canModifyNotice(user.role, user.id, notice.authorId)) return true
  if (notice.expiresAt && notice.expiresAt.getTime() <= Date.now()) return false

  if (user?.role === 'TEACHER') {
    return notice.audience === 'ALL' || notice.audience === 'TEACHERS'
  }

  if (user?.role === 'STUDENT') {
    if (notice.audience !== 'ALL' && notice.audience !== 'STUDENTS') return false
    if (notice.program !== null && notice.program !== user.program) return false
    if (notice.semester !== null && notice.semester !== user.semester) return false
    return true
  }

  return notice.audience === 'ALL'
}

/** Author or admin. Everyone else is refused. */
function assertCanManage(notice: NoticeRow, user: AuthUser): void {
  if (can(user.role, 'notices:moderate')) return
  if (notice.authorId === user.id) return
  throw forbidden('Only the author or an admin can change this notice.')
}

/**
 * Push is a side effect, not part of the response. It is deliberately not
 * awaited: a slow or broken Expo must never delay or fail a notice that is
 * already committed to the database.
 */
function dispatchPush(notice: NoticeRow): void {
  if (notice.expiresAt && notice.expiresAt.getTime() <= Date.now()) return
  void notifyNotice({
    id: notice.id,
    title: notice.title,
    body: notice.body,
    audience: notice.audience,
    program: notice.program,
    semester: notice.semester,
  }).catch((error: unknown) => {
    console.error(`[notices] push dispatch failed for ${notice.id}`, error)
  })
}

router.get(
  '/',
  optionalAuth,
  validateQuery(listNoticesQuerySchema),
  asyncHandler(async (req, res) => {
    const query = parsedQuery<typeof listNoticesQuerySchema>(res)
    const { page, limit, skip } = readPagination({ page: query.page, limit: query.limit })

    const clauses = visibilityClauses(req.user)
    if (query.category) {
      clauses.push({ category: { equals: query.category, mode: 'insensitive' } })
    }
    if (query.q) {
      clauses.push({
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { body: { contains: query.q, mode: 'insensitive' } },
        ],
      })
    }

    const where: Prisma.NoticeWhereInput = { AND: clauses }

    const [total, notices] = await Promise.all([
      prisma.notice.count({ where }),
      prisma.notice.findMany({
        where,
        select: noticeSelect,
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        skip,
        take: limit,
      }),
    ])

    return paginated(
      res,
      notices.map((notice) => serializeNotice(notice)),
      buildMeta(page, limit, total),
    )
  }),
)

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const notice = await prisma.notice.findUnique({
      where: { id: readId(req) },
      select: noticeSelect,
    })
    // A notice the caller may not see is reported as missing rather than
    // forbidden, so the endpoint cannot be used to probe for targeted notices.
    if (!notice || !canView(notice, req.user)) throw notFound('Notice')
    return ok(res, serializeNotice(notice))
  }),
)

router.post(
  '/',
  authenticate,
  requirePermission('notices:write'),
  validateBody(createNoticeSchema),
  asyncHandler(async (req, res) => {
    const user = requireUser(req)
    const input = req.body as CreateNoticeInput

    const notice = await prisma.notice.create({
      data: {
        title: input.title,
        body: input.body,
        category: input.category,
        audience: input.audience,
        pinned: input.pinned,
        attachmentUrl: input.attachmentUrl ?? null,
        program: input.program ?? null,
        semester: input.semester ?? null,
        ...(input.publishedAt ? { publishedAt: input.publishedAt } : {}),
        expiresAt: input.expiresAt ?? null,
        author: { connect: { id: user.id } },
      },
      select: noticeSelect,
    })

    dispatchPush(notice)
    return created(res, serializeNotice(notice))
  }),
)

router.patch(
  '/:id',
  authenticate,
  // Authorship alone is not the guard: a teacher demoted to STUDENT still owns
  // the notices they wrote, so the role is checked before ownership is.
  requirePermission('notices:write'),
  validateBody(updateNoticeSchema),
  asyncHandler(async (req, res) => {
    const user = requireUser(req)
    const id = readId(req)

    const existing = await prisma.notice.findUnique({ where: { id }, select: noticeSelect })
    if (!existing) throw notFound('Notice')
    assertCanManage(existing, user)

    const input = req.body as UpdateNoticeInput
    const data: Prisma.NoticeUpdateInput = { ...input }

    const notice = await prisma.notice.update({ where: { id }, data, select: noticeSelect })
    return ok(res, serializeNotice(notice))
  }),
)

router.delete(
  '/:id',
  authenticate,
  requirePermission('notices:write'),
  asyncHandler(async (req, res) => {
    const user = requireUser(req)
    const id = readId(req)

    const existing = await prisma.notice.findUnique({ where: { id }, select: noticeSelect })
    if (!existing) throw notFound('Notice')
    assertCanManage(existing, user)

    await prisma.notice.delete({ where: { id } })
    return ok(res, { id, deleted: true })
  }),
)

export default router
