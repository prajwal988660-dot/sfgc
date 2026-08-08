import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Role } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { extractBearer, verifyToken } from '../lib/jwt'
import { forbidden, unauthenticated } from '../lib/errors'

/**
 * The public shape of a user. Selected explicitly rather than by deleting
 * `passwordHash` afterwards, so a future column cannot leak by default.
 */
export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
  registerNo: true,
  program: true,
  semester: true,
  section: true,
  admissionYear: true,
  department: true,
  employeeId: true,
  designation: true,
  createdAt: true,
} as const

export type AuthUser = {
  id: string
  email: string
  name: string
  role: Role
  phone: string | null
  avatarUrl: string | null
  isActive: boolean
  registerNo: string | null
  program: string | null
  semester: number | null
  section: string | null
  admissionYear: number | null
  department: string | null
  employeeId: string | null
  designation: string | null
  createdAt: Date
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

/**
 * Loads the user fresh from the database on every request rather than trusting
 * the token's claims. A deactivated or deleted account stops working
 * immediately instead of when its JWT eventually expires.
 */
async function loadUser(token: string): Promise<AuthUser> {
  const payload = verifyToken(token)
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: publicUserSelect,
  })
  if (!user) throw unauthenticated('Account no longer exists.')
  if (!user.isActive) throw forbidden('This account has been deactivated.')
  return user
}

/** Rejects the request unless a valid token is present. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = extractBearer(req.headers.authorization)
  if (!token) {
    next(unauthenticated('Sign in to continue.'))
    return
  }
  loadUser(token)
    .then((user) => {
      req.user = user
      next()
    })
    .catch(next)
}

/**
 * Attaches `req.user` when a valid token is present, but never rejects.
 * Used by routes that are public yet richer when signed in — event listings
 * (`isRegistered`) and notices (audience filtering).
 */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = extractBearer(req.headers.authorization)
  if (!token) {
    next()
    return
  }
  loadUser(token)
    .then((user) => {
      req.user = user
      next()
    })
    .catch(() => next()) // a bad token is simply treated as signed out
}

/**
 * Restricts a route to the given roles. This is the guard that keeps students
 * out of attendance marking, notice creation and mark entry.
 *
 * Always mount after `authenticate`.
 */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(unauthenticated('Sign in to continue.'))
      return
    }
    if (!roles.includes(req.user.role)) {
      next(
        forbidden(
          `This action is restricted to ${roles
            .map((role) => role.toLowerCase())
            .join(' or ')} accounts.`,
        ),
      )
      return
    }
    next()
  }
}

export const requireAdmin = requireRole('ADMIN')
export const requireStaff = requireRole('ADMIN', 'TEACHER')

/**
 * Students may only read their own records. Staff may read anyone's.
 * `paramName` is the route param holding the target student id.
 */
export function requireSelfOrStaff(paramName = 'id'): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(unauthenticated('Sign in to continue.'))
      return
    }
    const targetId = req.params[paramName]
    if (req.user.role === 'STUDENT' && targetId !== req.user.id) {
      next(forbidden('You can only view your own records.'))
      return
    }
    next()
  }
}
