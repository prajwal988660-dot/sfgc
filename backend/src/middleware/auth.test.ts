import type { NextFunction, Request, Response } from 'express'
import { describe, expect, it } from 'vitest'

import { requirePermission, requireSelfOrPermission } from './auth'
import type { AuthUser } from './auth'
import { AppError } from '../lib/errors'

/**
 * The guards, exercised directly.
 *
 * No database and no HTTP: these are middleware functions of (req, res, next),
 * so a plain object is a faithful request. That keeps the security boundary
 * testable without a test database — which this project does not have, since
 * the only Postgres available is the live one.
 *
 * What this does NOT cover, and should be said plainly: the wiring. These prove
 * `requirePermission('x')` admits and refuses the right roles; they cannot prove
 * that a given route actually mounts it. That needs end-to-end tests against a
 * throwaway database.
 */

const USER_ID = 'user_self'
const OTHER_ID = 'user_other'

function fakeUser(role: AuthUser['role'], id = USER_ID): AuthUser {
  return { id, role, email: 'x@example.com', name: 'Test' } as AuthUser
}

/** Runs a middleware and reports what it passed to `next()`. */
function run(
  middleware: ReturnType<typeof requirePermission>,
  req: Partial<Request>,
): { allowed: boolean; error?: AppError } {
  let captured: unknown
  const next: NextFunction = (err?: unknown) => {
    captured = err
  }
  middleware(req as Request, {} as Response, next)
  if (captured instanceof AppError) return { allowed: false, error: captured }
  // next() with no argument is the only way through.
  return { allowed: captured === undefined }
}

describe('requirePermission', () => {
  it('rejects an unauthenticated request', () => {
    const result = run(requirePermission('notices:write'), {})
    expect(result.allowed).toBe(false)
    expect(result.error?.code).toBe('UNAUTHENTICATED')
  })

  it('admits a role that holds the permission', () => {
    expect(run(requirePermission('notices:write'), { user: fakeUser('TEACHER') }).allowed).toBe(
      true,
    )
  })

  it('refuses a role that does not', () => {
    const result = run(requirePermission('attendance:mark'), {
      user: fakeUser('CONTENT_ADMIN'),
    })
    expect(result.allowed).toBe(false)
    expect(result.error?.code).toBe('FORBIDDEN')
  })

  it('refuses a student every write permission', () => {
    for (const permission of ['notices:write', 'attendance:mark', 'users:manage'] as const) {
      expect(run(requirePermission(permission), { user: fakeUser('STUDENT') }).allowed).toBe(
        false,
      )
    }
  })

  it('requires ALL listed permissions, not any', () => {
    // A content admin has notices:write but not attendance:mark.
    const result = run(requirePermission('notices:write', 'attendance:mark'), {
      user: fakeUser('CONTENT_ADMIN'),
    })
    expect(result.allowed).toBe(false)
  })

  it('admits the deprecated ADMIN exactly as SUPER_ADMIN', () => {
    for (const role of ['ADMIN', 'SUPER_ADMIN'] as const) {
      expect(run(requirePermission('users:manage'), { user: fakeUser(role) }).allowed).toBe(
        true,
      )
    }
  })
})

describe('requireSelfOrPermission', () => {
  const guard = requireSelfOrPermission('progress:read:any', 'studentId')

  it('rejects an unauthenticated request', () => {
    expect(run(guard, { params: { studentId: USER_ID } }).allowed).toBe(false)
  })

  it('lets anyone read their own record', () => {
    expect(
      run(guard, { user: fakeUser('STUDENT'), params: { studentId: USER_ID } }).allowed,
    ).toBe(true)
  })

  it('stops a student reading someone else’s record', () => {
    const result = run(guard, {
      user: fakeUser('STUDENT'),
      params: { studentId: OTHER_ID },
    })
    expect(result.allowed).toBe(false)
    expect(result.error?.code).toBe('FORBIDDEN')
  })

  it('lets a teacher read someone else’s record', () => {
    expect(
      run(guard, { user: fakeUser('TEACHER'), params: { studentId: OTHER_ID } }).allowed,
    ).toBe(true)
  })

  it('stops a content admin and an admissions officer reading a student’s record', () => {
    // The regression test for the original bug. The previous guard denied only
    // STUDENT, so both of these roles passed — reading any student's marks.
    for (const role of ['CONTENT_ADMIN', 'ADMISSIONS_OFFICER'] as const) {
      const result = run(guard, {
        user: fakeUser(role, 'staff_id'),
        params: { studentId: OTHER_ID },
      })
      expect(result.allowed, `${role} must not read another user's record`).toBe(false)
    }
  })

  it('does not admit a request with a missing route param', () => {
    // An absent param must not read as "same as me". If it did, a route mounted
    // with the wrong param name would silently authorise everyone.
    const result = run(guard, { user: fakeUser('CONTENT_ADMIN', 'staff_id'), params: {} })
    expect(result.allowed).toBe(false)
  })
})
