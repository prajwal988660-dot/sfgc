import { Router, type Request } from 'express'
import { Prisma, type Role } from '@prisma/client'

import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { ok, created } from '../lib/respond'
import { badRequest, conflict, forbidden, notFound, unauthenticated } from '../lib/errors'
import { authenticate, requirePermission, type AuthUser } from '../middleware/auth'
import { can } from '../auth/permissions'
import { validateBody, validateQuery, parsedQuery } from '../middleware/validate'
import { toCalendarDay, todayCalendarDay } from '../validators/attendance.schema'
import {
  createSubjectSchema,
  enrollStudentsSchema,
  listSubjectsQuerySchema,
  rosterQuerySchema,
  updateSubjectSchema,
  type CreateSubjectBody,
  type EnrollStudentsBody,
  type UpdateSubjectBody,
} from '../validators/subjects.schema'

const router = Router()

/**
 * The contract's `Subject`. `_count` is selected only so it can be flattened
 * into `studentCount`; it never reaches the response.
 */
const subjectSelect = {
  id: true,
  code: true,
  name: true,
  program: true,
  semester: true,
  section: true,
  credits: true,
  department: true,
  academicYear: true,
  isActive: true,
  teacher: { select: { id: true, name: true, email: true } },
  _count: { select: { students: true } },
} as const

interface SubjectRow {
  id: string
  code: string
  name: string
  program: string
  semester: number
  section: string | null
  credits: number
  department: string | null
  academicYear: string
  isActive: boolean
  teacher: { id: string; name: string; email: string } | null
  _count: { students: number }
}

function toSubject(row: SubjectRow) {
  const { _count, ...subject } = row
  return { ...subject, studentCount: _count.students }
}

function requireUser(req: Request): AuthUser {
  if (!req.user) throw unauthenticated('Sign in to continue.')
  return req.user
}

function pathId(req: Request): string {
  const id = req.params.id
  if (!id) throw notFound('Subject')
  return id
}

/**
 * `date` is stored as a Postgres `date`, which Prisma reads and writes as a
 * UTC-midnight `DateTime`. These are the same helpers `/attendance` uses, so an
 * unqualified roster resolves to exactly the day `POST /attendance/mark` would
 * have written. Deriving "today" from `toISOString()` instead would return the
 * UTC day, and every `todayStatus` would come back null whenever the server's
 * local date and the UTC date disagree. `toCalendarDay` also rejects dates that
 * do not exist (`2026-02-31`) rather than rolling them into the next month.
 */
function rosterDay(key: string | undefined): Date {
  if (!key) return todayCalendarDay()
  const date = toCalendarDay(key)
  if (!date) {
    throw badRequest('That is not a valid calendar date.', [
      { path: 'date', message: `${key} is not a real YYYY-MM-DD date.` },
    ])
  }
  return date
}

/** Enrolment must not quietly attach teachers or unknown ids to a roster. */
function assertStudents(ids: string[], rows: { id: string; role: Role }[]): void {
  const roleById = new Map(rows.map((row) => [row.id, row.role]))
  const invalid = ids.filter((id) => roleById.get(id) !== 'STUDENT')
  if (invalid.length > 0) {
    throw badRequest(
      `These ids are not student accounts: ${invalid.join(', ')}.`,
      invalid.map((id) => ({
        path: 'studentIds',
        message: `${id} is not an existing student account.`,
      })),
    )
  }
}

async function assertTeacher(teacherId: string): Promise<void> {
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { role: true },
  })
  if (!teacher || !can(teacher.role, 'attendance:mark')) {
    throw badRequest('teacherId must reference a teacher account.', [
      { path: 'teacherId', message: `${teacherId} is not an existing teacher account.` },
    ])
  }
}

async function assertCodeIsFree(code: string): Promise<void> {
  const clash = await prisma.subject.findUnique({ where: { code }, select: { id: true } })
  if (clash) throw conflict(`Subject code ${code} is already in use.`)
}

// ------------------------------------------------------------------ reads ---

router.get(
  '/',
  authenticate,
  validateQuery(listSubjectsQuerySchema),
  asyncHandler(async (req, res) => {
    const user = requireUser(req)
    const query = parsedQuery<typeof listSubjectsQuerySchema>(res)

    const filters: Prisma.SubjectWhereInput[] = []
    if (query.program) filters.push({ program: query.program })
    if (query.semester !== undefined) filters.push({ semester: query.semester })
    if (query.section) filters.push({ section: query.section })
    if (query.teacherId) filters.push({ teacherId: query.teacherId })

    // `all=true` lifts the default scope for staff only; a student is always
    // limited to their own enrolments no matter what they ask for.
    const unscoped = query.all === true && can(user.role, 'subjects:read:all')
    if (!unscoped) {
      if (user.role === 'TEACHER') filters.push({ teacherId: user.id })
      else if (user.role === 'STUDENT') filters.push({ students: { some: { id: user.id } } })
    }

    const subjects = await prisma.subject.findMany({
      where: filters.length > 0 ? { AND: filters } : {},
      select: subjectSelect,
      orderBy: [
        { program: 'asc' },
        { semester: 'asc' },
        { section: 'asc' },
        { code: 'asc' },
      ],
    })

    return ok(res, subjects.map(toSubject))
  }),
)

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const subject = await prisma.subject.findUnique({
      where: { id: pathId(req) },
      select: subjectSelect,
    })
    if (!subject) throw notFound('Subject')
    return ok(res, toSubject(subject))
  }),
)

router.get(
  '/:id/students',
  authenticate,
  requirePermission('students:read'),
  validateQuery(rosterQuerySchema),
  asyncHandler(async (req, res) => {
    const user = requireUser(req)
    const subjectId = pathId(req)
    const query = parsedQuery<typeof rosterQuerySchema>(res)
    const day = rosterDay(query.date)

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: subjectSelect,
    })
    if (!subject) throw notFound('Subject')
    if (user.role === 'TEACHER' && subject.teacher?.id !== user.id) {
      throw forbidden('You can only open the roster for a subject you teach.')
    }

    const [students, records] = await Promise.all([
      // `role` is pinned to STUDENT to match the roster `/attendance/class`
      // returns and the enrolment `POST /attendance/mark` will accept; a staff
      // account attached to the subject would otherwise appear here and then be
      // rejected as "not enrolled" the moment the teacher submitted the day.
      prisma.user.findMany({
        where: { role: 'STUDENT', enrolledSubjects: { some: { id: subjectId } } },
        select: { id: true, name: true, registerNo: true, avatarUrl: true },
      }),
      // One query for the whole day, then a lookup per student. Narrowed to
      // the requested hour, so opening period 3 shows what period 3 holds
      // rather than whatever the first period of the day was marked as.
      prisma.attendance.findMany({
        where: { subjectId, date: day, periodNumber: query.periodNumber ?? 1 },
        select: { studentId: true, status: true },
      }),
    ])

    const statusByStudent = new Map(records.map((record) => [record.studentId, record.status]))
    const rosterKey = (student: { registerNo: string | null; name: string }) =>
      student.registerNo ?? student.name

    const roster = students
      .sort((a, b) =>
        rosterKey(a).localeCompare(rosterKey(b), 'en', { numeric: true, sensitivity: 'base' }),
      )
      .map((student) => ({
        id: student.id,
        name: student.name,
        registerNo: student.registerNo,
        avatarUrl: student.avatarUrl,
        todayStatus: statusByStudent.get(student.id) ?? null,
      }))

    return ok(res, { subject: toSubject(subject), students: roster })
  }),
)

// ----------------------------------------------------------------- writes ---

router.post(
  '/',
  authenticate,
  requirePermission('subjects:manage'),
  validateBody(createSubjectSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as CreateSubjectBody
    const studentIds = body.studentIds ?? []

    await assertCodeIsFree(body.code)
    if (body.teacherId) await assertTeacher(body.teacherId)
    if (studentIds.length > 0) {
      const rows = await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, role: true },
      })
      assertStudents(studentIds, rows)
    }

    const subject = await prisma.subject.create({
      data: {
        code: body.code,
        name: body.name,
        program: body.program,
        semester: body.semester,
        section: body.section,
        credits: body.credits,
        department: body.department,
        academicYear: body.academicYear,
        isActive: body.isActive,
        teacherId: body.teacherId,
        students:
          studentIds.length > 0
            ? { connect: studentIds.map((id) => ({ id })) }
            : undefined,
      },
      select: subjectSelect,
    })

    return created(res, toSubject(subject))
  }),
)

router.patch(
  '/:id',
  authenticate,
  requirePermission('subjects:manage'),
  validateBody(updateSubjectSchema),
  asyncHandler(async (req, res) => {
    const id = pathId(req)
    const body = req.body as UpdateSubjectBody

    const existing = await prisma.subject.findUnique({
      where: { id },
      select: { id: true, code: true },
    })
    if (!existing) throw notFound('Subject')

    if (body.code && body.code !== existing.code) await assertCodeIsFree(body.code)
    if (body.teacherId) await assertTeacher(body.teacherId)

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        code: body.code,
        name: body.name,
        program: body.program,
        semester: body.semester,
        section: body.section,
        credits: body.credits,
        department: body.department,
        academicYear: body.academicYear,
        isActive: body.isActive,
        teacherId: body.teacherId,
      },
      select: subjectSelect,
    })

    return ok(res, toSubject(subject))
  }),
)

router.delete(
  '/:id',
  authenticate,
  requirePermission('subjects:manage'),
  asyncHandler(async (req, res) => {
    const id = pathId(req)
    const existing = await prisma.subject.findUnique({ where: { id }, select: { id: true } })
    if (!existing) throw notFound('Subject')

    await prisma.subject.delete({ where: { id } })
    return ok(res, { id: existing.id })
  }),
)

router.post(
  '/:id/enroll',
  authenticate,
  requirePermission('subjects:manage'),
  validateBody(enrollStudentsSchema),
  asyncHandler(async (req, res) => {
    const subjectId = pathId(req)
    const { studentIds } = req.body as EnrollStudentsBody

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    })
    if (!subject) throw notFound('Subject')

    // Role check and "already enrolled?" in one round trip.
    const rows = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        role: true,
        enrolledSubjects: { where: { id: subjectId }, select: { id: true } },
      },
    })
    assertStudents(studentIds, rows)

    const toConnect = rows
      .filter((row) => row.enrolledSubjects.length === 0)
      .map((row) => ({ id: row.id }))

    if (toConnect.length > 0) {
      await prisma.subject.update({
        where: { id: subjectId },
        data: { students: { connect: toConnect } },
      })
    }

    return ok(res, { enrolled: toConnect.length })
  }),
)

export default router
