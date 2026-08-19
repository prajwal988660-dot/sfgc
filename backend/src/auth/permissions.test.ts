import { describe, expect, it } from 'vitest'

import { ROLE_PERMISSIONS, can, canAll, type Permission } from './permissions'

/**
 * The permission table is the security policy. These tests are not here to
 * confirm that `can()` reads an array — they are here so that a future edit
 * which quietly widens a grant fails loudly.
 *
 * Several read as "X must NOT be able to Y". Those are the important ones: they
 * encode the three vulnerabilities this layer replaced, so that reintroducing
 * any of them breaks the build rather than the students' privacy.
 */

const ALL_ROLES = [
  'STUDENT',
  'TEACHER',
  'CONTENT_ADMIN',
  'ADMISSIONS_OFFICER',
  'SUPER_ADMIN',
  'ADMIN',
] as const

describe('permission table', () => {
  it('defines permissions for every role in the enum', () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_PERMISSIONS[role], `${role} has no entry`).toBeDefined()
    }
  })

  it('grants a student nothing — their own data is reached by ownership', () => {
    expect(ROLE_PERMISSIONS.STUDENT).toEqual([])
  })

  it('keeps the deprecated ADMIN identical to SUPER_ADMIN', () => {
    // The two names coexist while the migration completes. If they ever drift,
    // the administrator's capabilities depend on which name their row happens
    // to hold — a difference nobody would think to look for.
    expect(ROLE_PERMISSIONS.ADMIN).toEqual(ROLE_PERMISSIONS.SUPER_ADMIN)
  })

  it('gives super_admin every permission that exists', () => {
    const everyGrantedPermission = new Set<Permission>(
      ALL_ROLES.flatMap((role) => [...ROLE_PERMISSIONS[role]]),
    )
    for (const permission of everyGrantedPermission) {
      expect(can('SUPER_ADMIN', permission), `super_admin lacks ${permission}`).toBe(true)
    }
  })
})

describe('student records are closed to roles with no business in them', () => {
  // The regression tests for the vulnerabilities this layer fixed.
  //
  // Before, authorisation was written as "not a student". content_admin and
  // admissions_officer are not students, so both would have passed every one of
  // these checks the moment the roles existed — reading any student's
  // attendance and marks, including marks a teacher had not published.
  const STUDENT_RECORD_PERMISSIONS: Permission[] = [
    'attendance:read:any',
    'attendance:mark',
    'progress:read:any',
    'progress:read:unpublished',
    'progress:write',
    'students:manage',
  ]

  for (const role of ['CONTENT_ADMIN', 'ADMISSIONS_OFFICER'] as const) {
    for (const permission of STUDENT_RECORD_PERMISSIONS) {
      it(`${role} cannot ${permission}`, () => {
        expect(can(role, permission)).toBe(false)
      })
    }
  }

  it('a student cannot read another student’s records', () => {
    expect(can('STUDENT', 'attendance:read:any')).toBe(false)
    expect(can('STUDENT', 'progress:read:any')).toBe(false)
  })
})

describe('elevation is restricted to super_admin', () => {
  // users:manage is the permission that lets an account create other accounts
  // and change roles. Anyone holding it can grant themselves anything, so it is
  // the one grant that must never widen by accident.
  it('only super_admin (and the deprecated ADMIN) may manage users', () => {
    const holders = ALL_ROLES.filter((role) => can(role, 'users:manage'))
    expect(holders.sort()).toEqual(['ADMIN', 'SUPER_ADMIN'])
  })

  it('a teacher cannot manage users or academic structure', () => {
    expect(can('TEACHER', 'users:manage')).toBe(false)
    expect(can('TEACHER', 'academics:manage')).toBe(false)
  })
})

describe('roles keep the capabilities they are for', () => {
  it('a teacher can mark attendance and enter marks', () => {
    expect(canAll('TEACHER', ['attendance:mark', 'progress:write'])).toBe(true)
  })

  it('a content admin can publish site content', () => {
    expect(canAll('CONTENT_ADMIN', ['notices:write', 'events:write', 'media:upload'])).toBe(
      true,
    )
  })

  it('a content admin cannot mark attendance', () => {
    // Also why the teacher app refuses this role: every screen would 403.
    expect(can('CONTENT_ADMIN', 'attendance:mark')).toBe(false)
  })
})

describe('canAll', () => {
  it('requires every permission, not just one', () => {
    expect(canAll('CONTENT_ADMIN', ['notices:write', 'attendance:mark'])).toBe(false)
  })

  it('is vacuously true for an empty list', () => {
    expect(canAll('STUDENT', [])).toBe(true)
  })
})
