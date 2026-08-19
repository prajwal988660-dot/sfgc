import type { Role } from './types'

/**
 * Who each client admits, and what each role is called on screen.
 *
 * These lists were previously written inline in each client — `['ADMIN',
 * 'TEACHER']` in the website's session store, `role !== 'TEACHER' && role !==
 * 'ADMIN'` in the teacher app, and a `role === 'ADMIN' ? … : …` label in two
 * more places. Four copies of the same decision, none of which knew about the
 * others, so widening the roles meant finding all four or silently locking
 * somebody out of one client while the rest kept working.
 *
 * The API is still the real boundary; nothing here grants access to anything.
 * These decide which sign-in screen accepts you and what your role is called.
 */

/**
 * May open the website's staff panel.
 *
 * Everyone who has something to do there, including roles whose remit is only
 * part of it — the panel shows what each can actually use, and the API refuses
 * the rest regardless.
 */
export const STAFF_ROLES: readonly Role[] = [
  'SUPER_ADMIN',
  'CONTENT_ADMIN',
  'ADMISSIONS_OFFICER',
  'TEACHER',
  'ADMIN',
]

/**
 * May sign in to the teacher app.
 *
 * Deliberately narrower than STAFF_ROLES. The app exists to mark attendance and
 * enter marks, and a content administrator holds neither permission — letting
 * them in would present an app whose every screen returns 403. They use the
 * website's panel instead.
 */
export const TEACHER_APP_ROLES: readonly Role[] = ['TEACHER', 'SUPER_ADMIN', 'ADMIN']

/** May sign in to the student app. */
export const STUDENT_APP_ROLES: readonly Role[] = ['STUDENT']

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role)
}

export function canUseTeacherApp(role: Role): boolean {
  return TEACHER_APP_ROLES.includes(role)
}

/** How a role is written for a human. */
export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  CONTENT_ADMIN: 'Content admin',
  ADMISSIONS_OFFICER: 'Admissions',
  SUPER_ADMIN: 'Administrator',
  // Shown identically to SUPER_ADMIN: to everyone outside the codebase these
  // are the same job, and the distinction disappears once the row is migrated.
  ADMIN: 'Administrator',
}

export function roleLabel(role: Role): string {
  return ROLE_LABEL[role] ?? role
}
