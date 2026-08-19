import { Router } from 'express'
import type { Request } from 'express'
import type { AttendanceStatus, Prisma } from '@prisma/client'

import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { ok } from '../lib/respond'
import { badRequest, forbidden, notFound, unauthenticated } from '../lib/errors'
import { authenticate, requirePermission, requireSelfOrPermission } from '../middleware/auth'
import { can } from '../auth/permissions'
import type { AuthUser } from '../middleware/auth'
import { validateBody, validateQuery, parsedQuery } from '../middleware/validate'
import {
  classAttendanceQuerySchema,
  formatCalendarDay,
  markAttendanceSchema,
  studentAttendanceQuerySchema,
  toCalendarDay,
  todayCalendarDay,
} from '../validators/attendance.schema'
import type {
  MarkAttendanceBody,
  StudentAttendanceQuery,
} from '../validators/attendance.schema'

/** How many individual records a student attendance response carries. */
const RECENT_RECORD_LIMIT = 200

/** How many offending ids are named in an error message before it truncates. */
const NAMED_ID_LIMIT = 10

const router = Router()

// ------------------------------------------------------------- helpers ----

export interface AttendanceTally {
  present: number
  absent: number
  late: number
}

export interface AttendanceStats extends AttendanceTally {
  total: number
  percentage: number
}

export function emptyTally(): AttendanceTally {
  return { present: 0, absent: 0, late: 0 }
}

/**
 * `EXCUSED` is deliberately not counted. An authorised absence must not sit on
 * either side of the ratio — counting it as absent would punish the student,
 * counting it as present would inflate the figure.
 */
export function countStatus(
  tally: AttendanceTally,
  status: AttendanceStatus,
  count = 1,
): void {
  if (status === 'PRESENT') tally.present += count
  else if (status === 'LATE') tally.late += count
  else if (status === 'ABSENT') tally.absent += count
}

export function mergeTally(target: AttendanceTally, source: AttendanceTally): void {
  target.present += source.present
  target.absent += source.absent
  target.late += source.late
}

/**
 * The single definition of an attendance percentage used by every read route:
 * `PRESENT` and `LATE` count as attended, and the result is rounded to one
 * decimal. A student with no sessions yet scores 0 rather than NaN.
 */
export function summariseAttendance(tally: AttendanceTally): AttendanceStats {
  const total = tally.present + tally.absent + tally.late
  const attended = tally.present + tally.late
  return {
    ...tally,
    total,
    percentage: total === 0 ? 0 : Math.round((attended / total) * 1000) / 10,
  }
}

interface CalendarDayRange {
  gte?: Date
  lte?: Date
}

function buildDayRange(
  from: string | undefined,
  to: string | undefined,
): CalendarDayRange | undefined {
  const range: CalendarDayRange = {}
  if (from) {
    const start = toCalendarDay(from)
    if (start) range.gte = start
  }
  if (to) {
    const end = toCalendarDay(to)
    if (end) range.lte = end
  }
  return range.gte || range.lte ? range : undefined
}

function calendarDayOrToday(value: string | undefined): Date {
  if (!value) return todayCalendarDay()
  const parsed = toCalendarDay(value)
  if (!parsed) throw badRequest('Dates must be a real calendar day in YYYY-MM-DD form.')
  return parsed
}

/** Narrows `req.user` after `authenticate` has run. */
function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthenticated('Sign in to continue.')
  return req.user
}

/**
 * A teacher may only touch a subject they are assigned to; an admin may touch
 * any. Callers reach this only after the attendance:mark permission, so
 * anyone reaching it without students:manage is a teacher.
 */
function assertSubjectAccess(user: AuthUser, teacherId: string | null): void {
  // Holding the permission is not the same as being allowed this subject: a
  // teacher has attendance:mark for their own classes only. Only a role that
  // may manage anyone's students is exempt from the ownership rule.
  if (can(user.role, 'students:manage')) return
  if (teacherId !== user.id) {
    throw forbidden('You can only manage attendance for subjects you teach.')
  }
}

interface SubjectRef {
  id: string
  code: string
  name: string
}

const studentRefSelect = {
  id: true,
  name: true,
  registerNo: true,
  studentCode: true,
} as const
const subjectRefSelect = { id: true, code: true, name: true } as const

async function buildStudentAttendance(studentId: string, query: StudentAttendanceQuery) {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { ...studentRefSelect, role: true },
  })
  if (!student || student.role !== 'STUDENT') throw notFound('Student')

  const where: Prisma.AttendanceWhereInput = { studentId }
  if (query.subjectId) where.subjectId = query.subjectId
  const range = buildDayRange(query.from, query.to)
  if (range) where.date = range

  // Totals come from a grouped count over every matching row, so they stay
  // correct even though the record list below is capped.
  const [grouped, records] = await Promise.all([
    prisma.attendance.groupBy({
      by: ['subjectId', 'status'],
      where,
      _count: { _all: true },
    }),
    prisma.attendance.findMany({
      where,
      // Within a day, earliest period first — that is the order the classes
      // actually happened in, which is how a student reads their own day.
      orderBy: [{ date: 'desc' }, { periodNumber: 'asc' }],
      take: RECENT_RECORD_LIMIT,
      select: {
        id: true,
        date: true,
        periodNumber: true,
        status: true,
        remarks: true,
        subject: { select: subjectRefSelect },
      },
    }),
  ])

  // The whole timetable in one read, then matched in memory. Six rows joined
  // onto every attendance record would be the same six rows over and over.
  const periods = await prisma.period.findMany({
    select: { number: true, label: true, startTime: true, endTime: true },
  })
  const periodByNumber = new Map(periods.map((period) => [period.number, period]))

  const overall = emptyTally()
  const tallyBySubject = new Map<string, AttendanceTally>()
  for (const row of grouped) {
    const tally = tallyBySubject.get(row.subjectId) ?? emptyTally()
    countStatus(tally, row.status, row._count._all)
    tallyBySubject.set(row.subjectId, tally)
    countStatus(overall, row.status, row._count._all)
  }

  const subjectIds = [...tallyBySubject.keys()]
  const subjects: SubjectRef[] = subjectIds.length
    ? await prisma.subject.findMany({
        where: { id: { in: subjectIds } },
        select: subjectRefSelect,
      })
    : []

  const bySubject = subjects
    .map((subject) => ({
      subjectId: subject.id,
      code: subject.code,
      name: subject.name,
      ...summariseAttendance(tallyBySubject.get(subject.id) ?? emptyTally()),
    }))
    .sort((a, b) => a.code.localeCompare(b.code))

  return {
    student: {
      id: student.id,
      name: student.name,
      registerNo: student.registerNo,
      studentCode: student.studentCode,
    },
    overall: summariseAttendance(overall),
    bySubject,
    records: records.map((record) => {
      const period = periodByNumber.get(record.periodNumber)
      return {
        id: record.id,
        date: formatCalendarDay(record.date),
        periodNumber: record.periodNumber,
        // Null when a period was deleted from the timetable after the fact.
        // The number is still shown; only the clock times go missing.
        periodLabel: period?.label ?? null,
        startTime: period?.startTime ?? null,
        endTime: period?.endTime ?? null,
        status: record.status,
        remarks: record.remarks,
        subject: record.subject,
      }
    }),
  }
}

// -------------------------------------------------------------- routes ----

/**
 * Marking is the one write in this module, and the one place a student could
 * do real damage. `requireRole` keeps students out entirely; ownership of the
 * subject is then checked for teachers.
 */
router.post(
  '/mark',
  authenticate,
  requirePermission('attendance:mark'),
  validateBody(markAttendanceSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const body = req.body as MarkAttendanceBody
    const date = calendarDayOrToday(body.date)

    const subject = await prisma.subject.findUnique({
      where: { id: body.subjectId },
      select: { id: true, teacherId: true },
    })
    if (!subject) throw notFound('Subject')
    assertSubjectAccess(user, subject.teacherId)

    const studentIds = body.records.map((record) => record.studentId)
    const enrolled = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT',
        enrolledSubjects: { some: { id: subject.id } },
      },
      select: { id: true },
    })
    const enrolledIds = new Set(enrolled.map((student) => student.id))
    const strangers = studentIds.filter((id) => !enrolledIds.has(id))
    if (strangers.length > 0) {
      const named = strangers.slice(0, NAMED_ID_LIMIT).join(', ')
      const rest =
        strangers.length > NAMED_ID_LIMIT
          ? ` (and ${strangers.length - NAMED_ID_LIMIT} more)`
          : ''
      throw badRequest(
        `These students are not enrolled in this subject: ${named}${rest}.`,
        strangers.map((id) => ({
          path: 'records.studentId',
          message: `${id} is not enrolled in this subject.`,
        })),
      )
    }

    // The composite unique makes each upsert idempotent, so re-marking a day
    // corrects it instead of stacking duplicate rows.
    await prisma.$transaction(
      body.records.map((record) =>
        prisma.attendance.upsert({
          where: {
            studentId_subjectId_date_periodNumber: {
              studentId: record.studentId,
              subjectId: subject.id,
              date,
              periodNumber: body.periodNumber,
            },
          },
          create: {
            studentId: record.studentId,
            subjectId: subject.id,
            date,
            periodNumber: body.periodNumber,
            status: record.status,
            remarks: record.remarks,
            markedById: user.id,
          },
          update: {
            status: record.status,
            remarks: record.remarks,
            markedById: user.id,
          },
        }),
      ),
    )

    return ok(res, {
      marked: body.records.length,
      date: formatCalendarDay(date),
      periodNumber: body.periodNumber,
      subjectId: subject.id,
    })
  }),
)

// Mounted before '/student/:id' so the literal path wins the match.
router.get(
  '/me',
  authenticate,
  validateQuery(studentAttendanceQuerySchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const query = parsedQuery<typeof studentAttendanceQuerySchema>(res)
    return ok(res, await buildStudentAttendance(user.id, query))
  }),
)

router.get(
  '/student/:id',
  authenticate,
  requireSelfOrPermission('attendance:read:any', 'id'),
  validateQuery(studentAttendanceQuerySchema),
  asyncHandler(async (req, res) => {
    const studentId = req.params.id
    if (!studentId) throw notFound('Student')
    const query = parsedQuery<typeof studentAttendanceQuerySchema>(res)
    return ok(res, await buildStudentAttendance(studentId, query))
  }),
)

router.get(
  '/class/:subjectId',
  authenticate,
  requirePermission('attendance:mark'),
  validateQuery(classAttendanceQuerySchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req)
    const subjectId = req.params.subjectId
    if (!subjectId) throw notFound('Subject')
    const query = parsedQuery<typeof classAttendanceQuerySchema>(res)

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
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
        teacherId: true,
        teacher: { select: { id: true, name: true, email: true } },
        students: {
          where: { role: 'STUDENT' },
          select: studentRefSelect,
          orderBy: [{ registerNo: 'asc' }, { name: 'asc' }],
        },
      },
    })
    if (!subject) throw notFound('Subject')
    assertSubjectAccess(user, subject.teacherId)

    // `date` picks the day whose statuses are shown; `from`/`to` widen what the
    // cumulative stats and the summary are computed over.
    const range = buildDayRange(query.from, query.to)
    const focusDate = calendarDayOrToday(query.date ?? query.to)

    const cumulativeWhere: Prisma.AttendanceWhereInput = { subjectId: subject.id }
    if (range) cumulativeWhere.date = range

    const [grouped, dayRecords] = await Promise.all([
      prisma.attendance.groupBy({
        by: ['studentId', 'status'],
        where: cumulativeWhere,
        _count: { _all: true },
      }),
      prisma.attendance.findMany({
        where: {
          subjectId: subject.id,
          date: focusDate,
          // Without this, a subject taught twice in one day would show
          // whichever period happened to come back first as "today's" marks,
          // and the teacher would overwrite the other hour without noticing.
          ...(query.periodNumber === undefined
            ? {}
            : { periodNumber: query.periodNumber }),
        },
        select: { studentId: true, status: true },
      }),
    ])

    const rosterIds = new Set(subject.students.map((student) => student.id))

    const tallyByStudent = new Map<string, AttendanceTally>()
    for (const row of grouped) {
      if (!rosterIds.has(row.studentId)) continue // unenrolled since being marked
      const tally = tallyByStudent.get(row.studentId) ?? emptyTally()
      countStatus(tally, row.status, row._count._all)
      tallyByStudent.set(row.studentId, tally)
    }

    const statusByStudent = new Map<string, AttendanceStatus>()
    for (const row of dayRecords) {
      if (rosterIds.has(row.studentId)) statusByStudent.set(row.studentId, row.status)
    }

    const summaryTally = emptyTally()
    if (range) {
      for (const tally of tallyByStudent.values()) mergeTally(summaryTally, tally)
    } else {
      for (const status of statusByStudent.values()) countStatus(summaryTally, status)
    }

    const students = subject.students.map((student) => {
      const stats = summariseAttendance(tallyByStudent.get(student.id) ?? emptyTally())
      return {
        id: student.id,
        name: student.name,
        registerNo: student.registerNo,
        status: statusByStudent.get(student.id) ?? null,
        stats: {
          present: stats.present,
          total: stats.total,
          percentage: stats.percentage,
        },
      }
    })

    return ok(res, {
      subject: {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        program: subject.program,
        semester: subject.semester,
        section: subject.section,
        credits: subject.credits,
        department: subject.department,
        academicYear: subject.academicYear,
        isActive: subject.isActive,
        teacher: subject.teacher,
        studentCount: subject.students.length,
      },
      date: formatCalendarDay(focusDate),
      summary: summariseAttendance(summaryTally),
      students,
    })
  }),
)

export default router
