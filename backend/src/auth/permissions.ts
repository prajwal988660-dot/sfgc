import type { Role } from '@prisma/client'

/**
 * What each role may do.
 *
 * Authorisation used to be written as role comparisons scattered through the
 * handlers — `role === 'ADMIN'`, `role !== 'STUDENT'`. That works while there
 * are three roles and stops working the moment there are five, in two different
 * ways:
 *
 *   - Checks phrased as a NEGATION silently ADMIT every new role. `requireSelfOrStaff`
 *     denied only students, so an admissions officer would have been handed every
 *     student's attendance and marks the day the role was created — nobody would
 *     have written that rule down, and nothing would have failed to reveal it.
 *   - Checks phrased against 'ADMIN' silently DENY super_admin, which is the same
 *     account with a new name.
 *
 * Neither failure is visible at the call site. So the rules live here instead, as
 * data: one table to read when asking "who can do this?", and one place to change.
 *
 * The permissions below are deliberately derived from capabilities that already
 * exist in the API. There is no permission here for a feature that has not been
 * built — an unused permission reads like a promise the code does not keep.
 */
export type Permission =
  // --- attendance ---
  /** Mark or amend attendance. Teachers are still limited to their own subjects. */
  | 'attendance:mark'
  /** Read attendance for someone other than yourself. */
  | 'attendance:read:any'

  // --- progress cards ---
  | 'progress:write'
  | 'progress:read:any'
  /** See marks a teacher has not published yet. Distinct from reading at all. */
  | 'progress:read:unpublished'

  // --- site content ---
  | 'notices:write'
  /** Edit or delete a notice written by somebody else. */
  | 'notices:moderate'
  | 'events:write'
  /** Edit or delete an event created by somebody else. */
  | 'events:moderate'
  /** See who has registered for an event, including their contact details. */
  | 'events:registrations:read'
  | 'materials:write'
  | 'media:upload'

  // --- academic structure and people ---
  /** Streams, class groups, the period timetable. */
  | 'academics:manage'
  | 'students:read'
  | 'students:manage'
  | 'subjects:manage'
  /** List every subject, not only your own. */
  | 'subjects:read:all'
  /** Create accounts and change what role someone holds. */
  | 'users:manage'

/**
 * Everything. Spelled out rather than computed so that adding a permission
 * above forces a deliberate decision here instead of silently granting it.
 */
const SUPER_ADMIN: readonly Permission[] = [
  'attendance:mark',
  'attendance:read:any',
  'progress:write',
  'progress:read:any',
  'progress:read:unpublished',
  'notices:write',
  'notices:moderate',
  'events:write',
  'events:moderate',
  'events:registrations:read',
  'materials:write',
  'media:upload',
  'academics:manage',
  'students:read',
  'students:manage',
  'subjects:manage',
  'subjects:read:all',
  'users:manage',
]

/**
 * A teacher's reach is broad but always narrowed further by an ownership check
 * in the handler: `attendance:mark` gets them to the endpoint, and
 * `assertSubjectAccess` decides whether this particular subject is theirs. The
 * permission alone is never sufficient — see the ownership checks listed in the
 * module doc of middleware/auth.ts.
 */
const TEACHER: readonly Permission[] = [
  'attendance:mark',
  'attendance:read:any',
  'progress:write',
  'progress:read:any',
  'progress:read:unpublished',
  'notices:write',
  'events:write',
  'materials:write',
  'media:upload',
  'students:read',
  'subjects:read:all',
]

/**
 * Site content only. Explicitly NOT given anything touching a student's record:
 * a content administrator publishes notices and galleries, and has no business
 * reading attendance or marks. This is the grant the old `!== 'STUDENT'` checks
 * would have got wrong.
 */
const CONTENT_ADMIN: readonly Permission[] = [
  'notices:write',
  'notices:moderate',
  'events:write',
  'events:moderate',
  'events:registrations:read',
  'materials:write',
  'media:upload',
]

/**
 * Admission applications and their documents. Applicants are not yet students,
 * so this role gets no access to student records either. `media:upload` is
 * included because reviewing an application means handling its attachments.
 */
const ADMISSIONS_OFFICER: readonly Permission[] = ['media:upload']

/** A student's own data is reached by ownership, never by permission. */
const STUDENT: readonly Permission[] = []

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  STUDENT,
  TEACHER,
  CONTENT_ADMIN,
  ADMISSIONS_OFFICER,
  SUPER_ADMIN,
  /**
   * Deprecated, and identical to SUPER_ADMIN on purpose.
   *
   * The roles are being widened in three steps so the single live administrator
   * is never locked out: add the enum values, ship a build that accepts both
   * names, then migrate the row. During that middle step both names must grant
   * the same thing. Removed once no account holds ADMIN.
   */
  ADMIN: SUPER_ADMIN,
}

/** Whether a role holds a permission. The only way to ask. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/** Whether a role holds every one of these permissions. */
export function canAll(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.every((permission) => can(role, permission))
}
