import { describe, expect, it } from 'vitest'

import {
  canManageSubject,
  canModifyEvent,
  canModifyNotice,
  canReadRecordOf,
} from './ownership'

const ALICE = 'user_alice_teacher'
const BOB = 'user_bob_teacher'

describe('canManageSubject', () => {
  it('lets a teacher manage a subject assigned to them', () => {
    expect(canManageSubject('TEACHER', ALICE, ALICE)).toBe(true)
  })

  it('stops a teacher managing another teacher’s subject', () => {
    // The single most important rule in the attendance module: it is what keeps
    // one teacher from marking, and misrecording, another's class.
    expect(canManageSubject('TEACHER', ALICE, BOB)).toBe(false)
  })

  it('lets an administrator manage any subject', () => {
    expect(canManageSubject('SUPER_ADMIN', ALICE, BOB)).toBe(true)
    expect(canManageSubject('ADMIN', ALICE, BOB)).toBe(true)
  })

  it('refuses an unassigned subject rather than treating it as unowned', () => {
    // A subject with no teacher is the easiest row to be handed by accident.
    // "No owner" must mean nobody, not everybody.
    expect(canManageSubject('TEACHER', ALICE, null)).toBe(false)
  })

  it('refuses roles that hold no student permissions at all', () => {
    expect(canManageSubject('CONTENT_ADMIN', ALICE, ALICE)).toBe(false)
    expect(canManageSubject('ADMISSIONS_OFFICER', ALICE, ALICE)).toBe(false)
    expect(canManageSubject('STUDENT', ALICE, ALICE)).toBe(false)
  })
})

describe('canModifyEvent', () => {
  it('lets the author edit their own event', () => {
    expect(canModifyEvent('TEACHER', ALICE, ALICE)).toBe(true)
  })

  it('stops a teacher editing someone else’s event', () => {
    expect(canModifyEvent('TEACHER', ALICE, BOB)).toBe(false)
  })

  it('lets a content admin moderate anyone’s event', () => {
    expect(canModifyEvent('CONTENT_ADMIN', ALICE, BOB)).toBe(true)
  })

  it('refuses an orphaned event to a non-moderator', () => {
    // createdById goes null when the creator's account is deleted; the event
    // survives. It must not become editable by whoever asks first.
    expect(canModifyEvent('TEACHER', ALICE, null)).toBe(false)
    expect(canModifyEvent('SUPER_ADMIN', ALICE, null)).toBe(true)
  })
})

describe('canModifyNotice', () => {
  it('lets the author edit their own notice', () => {
    expect(canModifyNotice('TEACHER', ALICE, ALICE)).toBe(true)
  })

  it('stops a teacher editing another teacher’s notice', () => {
    expect(canModifyNotice('TEACHER', ALICE, BOB)).toBe(false)
  })

  it('lets a moderator edit anyone’s notice', () => {
    expect(canModifyNotice('CONTENT_ADMIN', ALICE, BOB)).toBe(true)
    expect(canModifyNotice('SUPER_ADMIN', ALICE, BOB)).toBe(true)
  })
})

describe('canReadRecordOf', () => {
  const STUDENT_A = 'student_a'
  const STUDENT_B = 'student_b'

  it('always lets someone read their own record', () => {
    expect(canReadRecordOf('STUDENT', STUDENT_A, STUDENT_A, 'progress:read:any')).toBe(true)
  })

  it('stops a student reading another student’s record', () => {
    expect(canReadRecordOf('STUDENT', STUDENT_A, STUDENT_B, 'progress:read:any')).toBe(false)
    expect(canReadRecordOf('STUDENT', STUDENT_A, STUDENT_B, 'attendance:read:any')).toBe(
      false,
    )
  })

  it('lets a teacher read a student’s record', () => {
    expect(canReadRecordOf('TEACHER', ALICE, STUDENT_A, 'progress:read:any')).toBe(true)
  })

  it('stops a content admin or admissions officer reading a student’s record', () => {
    // The exact vulnerability the old requireSelfOrStaff had: it denied only
    // students, so every other role read everything.
    for (const role of ['CONTENT_ADMIN', 'ADMISSIONS_OFFICER'] as const) {
      expect(canReadRecordOf(role, 'staff_id', STUDENT_A, 'progress:read:any')).toBe(false)
      expect(canReadRecordOf(role, 'staff_id', STUDENT_A, 'attendance:read:any')).toBe(false)
    }
  })
})
