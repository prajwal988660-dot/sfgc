import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Role } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { extractBearer, verifyToken } from '../lib/jwt'
import { forbidden, unauthenticated } from '../lib/errors'
import { can, canAll, type Permission } from '../auth/permissions'

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

export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN')
export const requireStaff = requireRole('ADMIN', 'SUPER_ADMIN', 'TEACHER')

/**
 * Restricts a route to holders of a permission.
 *
 * Prefer this over `requireRole`. A role list at the call site has to be
 * revisited every time a role is added, and the failure is silent in whichever
 * direction the list was wrong; a permission is a stable statement of what the
 * endpoint does, and `auth/permissions.ts` decides who holds it.
 */
export function requirePermission(...permissions: Permission[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(unauthenticated('Sign in to continue.'))
      return
    }
    if (!canAll(req.user.role, permissions)) {
      next(forbidden('Your account does not have permission to do that.'))
      return
    }
    next()
  }
}

/**
 * Lets someone through for their own record, or for anyone else's if they hold
 * `permission`.
 *
 * The permission is required rather than optional, and that is the point. This
 * guard previously read "deny if the caller is a STUDENT and the id is not
 * theirs", which is a rule about one role rather than about the data. Every
 * role that is not STUDENT passed — so the day an admissions officer or a
 * content administrator existed, both would have been reading any student's
 * attendance and marks, with nothing in the code stating that intent and no
 * error to reveal it. Naming the permission makes the grant deliberate.
 *
 * `paramName` is the route param holding the target user id.
 */
export function requireSelfOrPermission(
  permission: Permission,
  paramName = 'id',
): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(unauthenticated('Sign in to continue.'))
      return
    }
    const targetId = req.params[paramName]
    if (targetId === req.user.id) {
      next()
      return
    }
    if (!can(req.user.role, permission)) {
      next(forbidden('You can only view your own records.'))
      return
    }
    next()
  }
}
