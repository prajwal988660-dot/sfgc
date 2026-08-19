import { Router, type Request } from 'express'
import { Prisma, type EventRegistration } from '@prisma/client'
import { randomInt } from 'node:crypto'

import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { ok, created, paginated, readPagination, buildMeta } from '../lib/respond'
import { badRequest, conflict, forbidden, notFound, unauthenticated } from '../lib/errors'
import { authenticate, optionalAuth, requirePermission, type AuthUser } from '../middleware/auth'
import { can } from '../auth/permissions'
import { canModifyEvent } from '../auth/ownership'
import { validateBody, validateQuery, parsedQuery } from '../middleware/validate'
import {
  createEventSchema,
  listEventsQuerySchema,
  paginationQuerySchema,
  registerForEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type RegisterForEventInput,
  type UpdateEventInput,
} from '../validators/events.schema'

const router = Router()

/** Every event we return carries its registration count, so every read includes it. */
const withRegistrationCount = {
  _count: { select: { registrations: true } },
} as const

type EventWithCount = Prisma.EventGetPayload<{ include: typeof withRegistrationCount }>

/** Staff view of a registration — enough to contact the registrant. */
const registrationInclude = {
  user: {
    select: { id: true, name: true, email: true, role: true, registerNo: true, avatarUrl: true },
  },
} as const

// ------------------------------------------------------------------ helpers ---

function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthenticated('Sign in to continue.')
  return req.user
}

function isStaff(user: AuthUser | undefined): boolean {
  return user ? can(user.role, 'events:write') : false
}

function routeParam(req: Request, name: string): string {
  const value = req.params[name]
  if (!value) throw notFound('Event')
  return value
}

/**
 * Strips the raw `_count` relation off the row and replaces it with the two
 * derived fields the contract documents. `isRegistered` is omitted entirely for
 * anonymous callers rather than sent as `false`.
 */
function serializeEvent(event: EventWithCount, isRegistered?: boolean) {
  const { _count, ...rest } = event
  const registrationCount = _count.registrations
  return {
    ...rest,
    registrationCount,
    seatsLeft: rest.capacity === null ? null : Math.max(0, rest.capacity - registrationCount),
    ...(isRegistered === undefined ? {} : { isRegistered }),
  }
}

async function findEventByIdOrSlug(idOrSlug: string): Promise<EventWithCount> {
  const event = await prisma.event.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: withRegistrationCount,
  })
  if (!event) throw notFound('Event')
  return event
}

async function isRegisteredFor(userId: string, eventId: string): Promise<boolean> {
  const row = await prisma.eventRegistration.findFirst({
    where: { userId, eventId },
    select: { id: true },
  })
  return row !== null
}

/** One query for the whole page instead of one per event. */
async function registeredEventIds(userId: string, eventIds: string[]): Promise<Set<string>> {
  if (eventIds.length === 0) return new Set<string>()
  const rows = await prisma.eventRegistration.findMany({
    where: { userId, eventId: { in: eventIds } },
    select: { eventId: true },
  })
  return new Set(rows.map((row) => row.eventId))
}

const SLUG_MAX = 80

function slugify(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '') // "Kaléidoscope" -> "kaleidoscope", not "kal-idoscope"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, '')
  return base || 'event'
}

/** Appends `-2`, `-3`, … until the slug is free, keeping inside the 80-char cap. */
async function uniqueSlug(desired: string, excludeId?: string): Promise<string> {
  const root = slugify(desired)
  for (let suffix = 1; suffix <= 200; suffix += 1) {
    const tail = suffix === 1 ? '' : `-${suffix}`
    const candidate =
      tail === ''
        ? root
        : `${root.slice(0, SLUG_MAX - tail.length).replace(/-+$/g, '')}${tail}`
    const clash = await prisma.event.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
    if (!clash) return candidate
  }
  const tail = `-${Date.now().toString(36)}`
  return `${root.slice(0, SLUG_MAX - tail.length).replace(/-+$/g, '')}${tail}`
}

/** Base32-ish: no 0/O and no 1/I, so a ticket read aloud cannot be mistyped. */
const TICKET_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateTicketCode(): string {
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += TICKET_ALPHABET.charAt(randomInt(TICKET_ALPHABET.length))
  }
  return `SFGC-${code}`
}

function uniqueViolationTargets(error: unknown): string[] | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return null
  }
  const target = error.meta?.target
  if (Array.isArray(target)) return target.map(String)
  if (typeof target === 'string') return [target]
  return []
}

// -------------------------------------------------------------------- list ---

router.get(
  '/',
  optionalAuth,
  validateQuery(listEventsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = parsedQuery<typeof listEventsQuerySchema>(res)
    const { page, limit, skip } = readPagination({ page: query.page, limit: query.limit })

    const where: Prisma.EventWhereInput = {}
    if (!(query.includeUnpublished && isStaff(req.user))) where.isPublished = true
    if (query.category) where.category = query.category

    const now = new Date()
    const upcomingOnly = query.upcoming === true && query.past !== true
    const pastOnly = query.past === true && query.upcoming !== true
    if (upcomingOnly) where.startsAt = { gte: now }
    else if (pastOnly) where.startsAt = { lt: now }

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ]
    }

    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        include: withRegistrationCount,
        orderBy: { startsAt: pastOnly ? 'desc' : 'asc' },
        skip,
        take: limit,
      }),
    ])

    const registered = req.user
      ? await registeredEventIds(req.user.id, events.map((event) => event.id))
      : null

    paginated(
      res,
      events.map((event) =>
        serializeEvent(event, registered ? registered.has(event.id) : undefined),
      ),
      buildMeta(page, limit, total),
    )
  }),
)

// ---------------------------------------------------- current user's tickets ---

// Registered before '/:idOrSlug' so "me" is never parsed as an event id.
router.get(
  '/me/registrations',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { event: { include: withRegistrationCount } },
    })

    ok(
      res,
      registrations.map(({ event, ...registration }) => ({
        ...registration,
        event: serializeEvent(event, true),
      })),
    )
  }),
)

// -------------------------------------------------------------------- read ---

router.get(
  '/:idOrSlug',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const event = await findEventByIdOrSlug(routeParam(req, 'idOrSlug'))
    if (!event.isPublished && !isStaff(req.user)) throw notFound('Event')

    const isRegistered = req.user ? await isRegisteredFor(req.user.id, event.id) : undefined
    ok(res, serializeEvent(event, isRegistered))
  }),
)

// ------------------------------------------------------------------ create ---

router.post(
  '/',
  authenticate,
  requirePermission('events:write'),
  validateBody(createEventSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const { slug: requestedSlug, ...body } = req.body as CreateEventInput

    const event = await prisma.event.create({
      data: {
        ...body,
        slug: await uniqueSlug(requestedSlug ?? body.title),
        createdById: user.id,
      },
      include: withRegistrationCount,
    })

    created(res, serializeEvent(event, false))
  }),
)

// ------------------------------------------------------------------ update ---

router.patch(
  '/:id',
  authenticate,
  requirePermission('events:write'),
  validateBody(updateEventSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const id = routeParam(req, 'id')
    const existing = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, startsAt: true, endsAt: true, createdById: true },
    })
    if (!existing) throw notFound('Event')
    if (!canModifyEvent(user.role, user.id, existing.createdById)) {
      throw forbidden('You can only edit events you created.')
    }

    const { slug: requestedSlug, ...body } = req.body as UpdateEventInput

    // Both halves of the range must be compared against what will be stored,
    // not only against what this request happens to carry.
    const nextStartsAt = body.startsAt ?? existing.startsAt
    const nextEndsAt = body.endsAt === undefined ? existing.endsAt : body.endsAt
    if (nextEndsAt && nextEndsAt.getTime() <= nextStartsAt.getTime()) {
      throw badRequest('The event must end after it starts.', [
        { path: 'endsAt', message: 'endsAt must be after startsAt.' },
      ])
    }

    // A published event's slug is a public URL, so it only changes when the
    // caller explicitly sends a new one — never as a side effect of a retitle.
    const slug = requestedSlug ? await uniqueSlug(requestedSlug, existing.id) : undefined

    const event = await prisma.event.update({
      where: { id: existing.id },
      data: { ...body, ...(slug ? { slug } : {}) },
      include: withRegistrationCount,
    })

    ok(res, serializeEvent(event, await isRegisteredFor(user.id, event.id)))
  }),
)

// ------------------------------------------------------------------ delete ---

router.delete(
  '/:id',
  authenticate,
  requirePermission('events:registrations:read'),
  asyncHandler(async (req, res) => {
    const id = routeParam(req, 'id')
    const existing = await prisma.event.findUnique({ where: { id }, select: { id: true } })
    if (!existing) throw notFound('Event')

    await prisma.event.delete({ where: { id: existing.id } })
    ok(res, { id: existing.id, deleted: true })
  }),
)

// ---------------------------------------------------------------- register ---

router.post(
  '/:id/register',
  optionalAuth,
  validateBody(registerForEventSchema),
  asyncHandler(async (req, res) => {
    const event = await findEventByIdOrSlug(routeParam(req, 'id'))
    const body = req.body as RegisterForEventInput
    const user = req.user

    const name = body.name ?? user?.name
    const email = (body.email ?? user?.email)?.trim().toLowerCase()
    if (!name || !email) {
      throw badRequest('Name and email are required to register.', [
        ...(name ? [] : [{ path: 'name', message: 'Name is required.' }]),
        ...(email ? [] : [{ path: 'email', message: 'A valid email is required.' }]),
      ])
    }

    if (!event.isPublished) throw badRequest('This event is not open for registration.')
    if (!event.registrationOpen) throw badRequest('Registration for this event is closed.')
    if (event.startsAt.getTime() < Date.now()) {
      throw badRequest('This event has already started.')
    }
    if (event.capacity !== null && event._count.registrations >= event.capacity) {
      throw badRequest('This event is full — all seats have been taken.')
    }

    const duplicate = await prisma.eventRegistration.findUnique({
      where: { eventId_email: { eventId: event.id, email } },
      select: { id: true },
    })
    if (duplicate) {
      throw conflict(`${email} is already registered for "${event.title}".`)
    }

    const data = {
      eventId: event.id,
      userId: user?.id ?? null,
      name,
      email,
      phone: body.phone ?? null,
      college: body.college ?? null,
      teamName: body.teamName ?? null,
      teamMembers: body.teamMembers ?? null,
    }

    // The ticket code is random, so a collision is rare but not impossible;
    // a unique violation on ticketCode is retried, one on email is the caller's.
    const attempts = 5
    let registration: EventRegistration | null = null
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        registration = await prisma.eventRegistration.create({
          data: { ...data, ticketCode: generateTicketCode() },
        })
        break
      } catch (error) {
        const targets = uniqueViolationTargets(error)
        if (targets === null) throw error
        if (targets.some((target) => target.includes('email'))) {
          throw conflict(`${email} is already registered for "${event.title}".`)
        }
        if (attempt === attempts) throw error
      }
    }
    if (!registration) throw conflict('Could not issue a ticket code. Please try again.')

    const refreshed = await prisma.event.findUnique({
      where: { id: event.id },
      include: withRegistrationCount,
    })
    if (!refreshed) throw notFound('Event')

    created(res, {
      ticketCode: registration.ticketCode,
      registration,
      event: serializeEvent(refreshed, user ? true : undefined),
    })
  }),
)

// ----------------------------------------------------- staff registrations ---

router.get(
  '/:id/registrations',
  authenticate,
  requirePermission('events:write'),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req, res) => {
    const event = await findEventByIdOrSlug(routeParam(req, 'id'))

    // A registration list is a contact sheet: names, emails and phone numbers.
    // Role alone is too coarse for that, so a teacher sees only the events they
    // created; admins see all.
    if (!canModifyEvent(req.user!.role, req.user!.id, event.createdById)) {
      throw forbidden('You can only view registrations for events you created.')
    }

    const query = parsedQuery<typeof paginationQuerySchema>(res)
    const { page, limit, skip } = readPagination({ page: query.page, limit: query.limit })

    const where: Prisma.EventRegistrationWhereInput = { eventId: event.id }
    const [total, registrations] = await Promise.all([
      prisma.eventRegistration.count({ where }),
      prisma.eventRegistration.findMany({
        where,
        include: registrationInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    paginated(res, registrations, buildMeta(page, limit, total))
  }),
)

export default router
