import type { Role } from '@prisma/client'

import { can } from './permissions'

/**
 * Rules that depend on WHICH row is being touched, not just who is asking.
 *
 * A permission gets someone to an endpoint; these decide whether this
 * particular subject, event or notice is theirs to act on. The distinction
 * matters because every teacher holds `attendance:mark` — what separates them
 * is the subject in front of them.
 *
 * They live here, as pure functions of (role, ownerId, callerId), for one
 * reason: while they were written inline in handlers there was no way to test
 * them without a database and an HTTP request, so they were never tested at
 * all. These are the checks standing between one teacher and another teacher's
 * class, and between a student and every other student's marks.
 */

/**
 * Whether someone may mark attendance or open the roster for a subject.
 *
 * A teacher is confined to subjects assigned to them. Anyone who may manage
 * students at all — an administrator — is exempt, because they are already
 * trusted with the underlying records.
 *
 * `subjectTeacherId` is null for a subject with no teacher assigned. That must
 * NOT fall through to "no owner, so anyone may": an unassigned subject is the
 * easiest thing in the database to be handed by accident.
 */
export function canManageSubject(
  role: Role,
  callerId: string,
  subjectTeacherId: string | null,
): boolean {
  if (can(role, 'students:manage')) return true
  // Ownership is not a substitute for the permission, only a narrowing of it.
  // Being named as a subject's teacher must not confer attendance rights on a
  // role that holds none — otherwise demoting someone to a content role, or
  // assigning a subject to the wrong account, silently grants it back.
  if (!can(role, 'attendance:mark')) return false
  if (subjectTeacherId === null) return false
  return subjectTeacherId === callerId
}

/**
 * Whether someone may edit or delete an event.
 *
 * The author always may. Everyone else needs `events:moderate`, which is what
 * separates a content administrator (who tidies up anyone's events) from a
 * teacher (who may create events but only revise their own).
 *
 * `createdById` is null when the creating account has since been deleted —
 * Prisma sets the relation to null rather than removing the event. A null owner
 * must not match a null-ish caller id, or a malformed request could claim it.
 */
export function canModifyEvent(
  role: Role,
  callerId: string,
  createdById: string | null,
): boolean {
  if (can(role, 'events:moderate')) return true
  // Same principle as canManageSubject: authorship narrows a permission, it
  // does not grant one. Someone moved to a role without events:write keeps no
  // hold over events they created before the move.
  if (!can(role, 'events:write')) return false
  if (createdById === null) return false
  return createdById === callerId
}

/**
 * Whether someone may edit or delete a notice.
 *
 * Same shape as events: the author, or a holder of `notices:moderate`.
 */
export function canModifyNotice(
  role: Role,
  callerId: string,
  authorId: string | null,
): boolean {
  if (can(role, 'notices:moderate')) return true
  if (!can(role, 'notices:write')) return false
  if (authorId === null) return false
  return authorId === callerId
}

/**
 * Whether someone may read a record belonging to `ownerId`.
 *
 * Their own, always. Anyone else's only with the permission named — which is
 * the rule the old `role !== 'STUDENT'` version got wrong, by treating every
 * non-student as entitled.
 */
export function canReadRecordOf(
  role: Role,
  callerId: string,
  ownerId: string,
  permission: Parameters<typeof can>[1],
): boolean {
  if (ownerId === callerId) return true
  return can(role, permission)
}
