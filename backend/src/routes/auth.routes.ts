import { Router, type Request } from 'express'
import rateLimit from 'express-rate-limit'
import type { Prisma } from '@prisma/client'

import { env } from '../config/env'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { ok, created } from '../lib/respond'
import { AppError, conflict, forbidden, invalidCredentials, unauthenticated } from '../lib/errors'
import { hashPassword, verifyPassword } from '../lib/password'
import { signToken } from '../lib/jwt'
import {
  authenticate,
  optionalAuth,
  publicUserSelect,
  type AuthUser,
} from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import {
  loginSchema,
  pushTokenSchema,
  registerSchema,
  updateMeSchema,
  type LoginBody,
  type PushTokenBody,
  type RegisterBody,
  type UpdateMeBody,
} from '../validators/auth.schema'

const router = Router()

/**
 * Credential endpoints are the ones worth brute-forcing, so they get a far
 * tighter budget than the app-wide limiter in `app.ts`. Failures go through
 * the error middleware so they arrive in the same envelope as everything else.
 */
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 20 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        'RATE_LIMITED',
        'Too many attempts from this device. Please try again in a few minutes.',
      ),
    )
  },
})

/**
 * A bcrypt comparison always runs on login, even when no account matched, so
 * that response time cannot be used to discover which emails or register
 * numbers exist.
 */
const decoyHash = hashPassword('sfgc-decoy-password-that-never-matches').catch(() => '')

/** `req.user` is always set behind `authenticate`; this makes that typed. */
function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthenticated('Sign in to continue.')
  return req.user
}

const sameText = (a: string | null, b: string | null | undefined): boolean =>
  a !== null && b !== undefined && b !== null && a.toLowerCase() === b.toLowerCase()

// --------------------------------------------------------------- register ---

router.post(
  '/register',
  credentialLimiter,
  optionalAuth,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as RegisterBody

    if (body.role === 'ADMIN') {
      throw forbidden('Administrator accounts cannot be created through registration.')
    }
    if (body.role === 'TEACHER' && req.user?.role !== 'ADMIN') {
      throw forbidden('Only an administrator can create teacher accounts.')
    }

    const registerNo = body.role === 'STUDENT' ? body.registerNo : undefined
    const employeeId = body.role === 'TEACHER' ? body.employeeId : undefined

    // Pre-check so the caller learns *which* identifier is taken; the unique
    // indexes still backstop the race between this read and the insert.
    // Matching is case-insensitive because the unique indexes are not: without
    // it "SFGC101" and "sfgc101" would become two accounts.
    const clashFilters: Prisma.UserWhereInput[] = [
      { email: { equals: body.email, mode: 'insensitive' } },
    ]
    if (registerNo) clashFilters.push({ registerNo: { equals: registerNo, mode: 'insensitive' } })
    if (employeeId) clashFilters.push({ employeeId: { equals: employeeId, mode: 'insensitive' } })

    const clashes = await prisma.user.findMany({
      where: { OR: clashFilters },
      select: { email: true, registerNo: true, employeeId: true },
    })

    for (const clash of clashes) {
      if (sameText(clash.email, body.email)) {
        throw conflict('An account with this email already exists.')
      }
      if (sameText(clash.registerNo, registerNo)) {
        throw conflict(`Register number ${registerNo} is already registered.`)
      }
      if (sameText(clash.employeeId, employeeId)) {
        throw conflict(`Employee id ${employeeId} is already registered.`)
      }
    }

    const common = {
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      role: body.role,
      phone: body.phone ?? null,
      department: body.department ?? null,
    }

    const user = await prisma.user.create({
      data:
        body.role === 'STUDENT'
          ? {
              ...common,
              registerNo: body.registerNo,
              program: body.program ?? null,
              semester: body.semester ?? null,
              section: body.section ?? null,
            }
          : {
              ...common,
              employeeId: body.employeeId,
              designation: body.designation ?? null,
            },
      select: publicUserSelect,
    })

    return created(res, {
      token: signToken({ sub: user.id, role: user.role, email: user.email }),
      user,
    })
  }),
)

// ------------------------------------------------------------------ login ---

router.post(
  '/login',
  credentialLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body as LoginBody

    // One identifier, three possible columns. Case-insensitive so a phone
    // keyboard capitalising the first letter does not fail an otherwise
    // correct login.
    const record = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { registerNo: { equals: identifier, mode: 'insensitive' } },
          { employeeId: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      select: { ...publicUserSelect, passwordHash: true },
    })

    if (!record) {
      await verifyPassword(password, await decoyHash)
      throw invalidCredentials('Incorrect login or password.')
    }

    const { passwordHash, ...user } = record
    if (!(await verifyPassword(password, passwordHash))) {
      throw invalidCredentials('Incorrect login or password.')
    }

    // Checked only after the password matches: telling a stranger that an
    // account is deactivated would confirm the account exists.
    if (!user.isActive) {
      throw forbidden('This account has been deactivated. Contact the college office.')
    }

    return ok(res, {
      token: signToken({ sub: user.id, role: user.role, email: user.email }),
      user,
    })
  }),
)

// --------------------------------------------------------------------- me ---

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => ok(res, { user: currentUser(req) })),
)

router.patch(
  '/me',
  authenticate,
  validateBody(updateMeSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as UpdateMeBody

    const user = await prisma.user.update({
      where: { id: currentUser(req).id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
      },
      select: publicUserSelect,
    })

    return ok(res, { user })
  }),
)

// ------------------------------------------------------------- push token ---

router.post(
  '/push-token',
  authenticate,
  validateBody(pushTokenSchema),
  asyncHandler(async (req, res) => {
    const { expoPushToken } = req.body as PushTokenBody
    const { id } = currentUser(req)

    // A token identifies a device install, not a person. Detaching it from any
    // previous account stops notices for the last user of a shared phone from
    // landing on the new one.
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { expoPushToken, NOT: { id } },
        data: { expoPushToken: null },
      }),
      prisma.user.update({
        where: { id },
        data: { expoPushToken },
        select: { id: true },
      }),
    ])

    return ok(res, { ok: true })
  }),
)

export default router
