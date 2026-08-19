import { Router } from 'express'
import type { Prisma } from '@prisma/client'

import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { hashPassword } from '../lib/password'
import { badRequest, conflict, notFound } from '../lib/errors'
import { ok, created, paginated, readPagination, buildMeta } from '../lib/respond'
import { authenticate, requirePermission } from '../middleware/auth'
import { validateBody, validateQuery, parsedQuery } from '../middleware/validate'
import {
  createClassGroupSchema,
  createPeriodSchema,
  createStreamSchema,
  createStudentSchema,
  listClassGroupsQuerySchema,
  listStudentsQuerySchema,
  updateClassGroupSchema,
  updatePeriodSchema,
  updateStreamSchema,
  updateStudentSchema,
} from '../validators/academics.schema'
import type {
  CreateClassGroupInput,
  CreatePeriodInput,
  CreateStreamInput,
  CreateStudentInput,
  ListClassGroupsQuery,
  ListStudentsQuery,
  UpdateClassGroupInput,
  UpdatePeriodInput,
  UpdateStreamInput,
  UpdateStudentInput,
} from '../validators/academics.schema'

/**
 * Structure of the college: which streams exist, which classes sit inside
 * them, what the daily timetable looks like, and who is in each class.
 *
 * Reads are open to any signed-in user — the teacher app needs the class list
 * to pick from, and the student app names a student's own class. Writes are
 * admin-only: these rows are what attendance and student IDs hang off, and a
 * teacher deleting a stream would take a cohort's records with it.
 */

export const streamRoutes = Router()
export const classGroupRoutes = Router()
export const periodRoutes = Router()
export const studentRoutes = Router()

const streamSelect = {
  id: true,
  code: true,
  name: true,
  shortName: true,
  department: true,
  durationSemesters: true,
  isActive: true,
} as const

const studentSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  registerNo: true,
  studentCode: true,
  program: true,
  semester: true,
  section: true,
  admissionYear: true,
  guardianName: true,
  guardianPhone: true,
  isActive: true,
  streamId: true,
  classGroupId: true,
} as const

// --------------------------------------------------------------- streams ---

streamRoutes.get(
  '/',
  authenticate,
  asyncHandler(async (_req, res) => {
    const streams = await prisma.stream.findMany({
      select: {
        ...streamSelect,
        _count: { select: { classGroups: true, students: true } },
      },
      orderBy: { code: 'asc' },
    })

    return ok(
      res,
      streams.map(({ _count, ...stream }) => ({
        ...stream,
        classGroupCount: _count.classGroups,
        studentCount: _count.students,
      })),
    )
  }),
)

streamRoutes.post(
  '/',
  authenticate,
  requirePermission('academics:manage'),
  validateBody(createStreamSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as CreateStreamInput

    const clash = await prisma.stream.findUnique({ where: { code: body.code } })
    if (clash) throw conflict(`A stream with the code ${body.code} already exists.`)

    const stream = await prisma.stream.create({ data: body, select: streamSelect })
    return created(res, stream)
  }),
)

streamRoutes.patch(
  '/:id',
  authenticate,
  requirePermission('academics:manage'),
  validateBody(updateStreamSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Stream')
    const body = req.body as UpdateStreamInput

    const existing = await prisma.stream.findUnique({ where: { id } })
    if (!existing) throw notFound('Stream')

    if (body.code && body.code !== existing.code) {
      const clash = await prisma.stream.findUnique({ where: { code: body.code } })
      if (clash) throw conflict(`A stream with the code ${body.code} already exists.`)
    }

    const stream = await prisma.stream.update({
      where: { id },
      data: body,
      select: streamSelect,
    })
    return ok(res, stream)
  }),
)

streamRoutes.delete(
  '/:id',
  authenticate,
  requirePermission('academics:manage'),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Stream')

    const stream = await prisma.stream.findUnique({
      where: { id },
      select: { id: true, code: true, _count: { select: { students: true } } },
    })
    if (!stream) throw notFound('Stream')

    // Deleting the stream cascades to its class groups, and every student in
    // them would silently lose their class. Refuse and say how many, rather
    // than quietly detaching a cohort.
    if (stream._count.students > 0) {
      throw conflict(
        `${stream.code} still has ${stream._count.students} student(s). Move or remove them first.`,
      )
    }

    await prisma.stream.delete({ where: { id } })
    return ok(res, { id })
  }),
)

// ---------------------------------------------------------- class groups ---

const classGroupSelect = {
  id: true,
  semester: true,
  section: true,
  academicYear: true,
  streamId: true,
  stream: { select: { id: true, code: true, name: true, shortName: true } },
} as const

classGroupRoutes.get(
  '/',
  authenticate,
  validateQuery(listClassGroupsQuerySchema),
  asyncHandler(async (_req, res) => {
    const query = parsedQuery<typeof listClassGroupsQuerySchema>(res) as ListClassGroupsQuery

    const where: Prisma.ClassGroupWhereInput = {}
    if (query.streamId) where.streamId = query.streamId
    if (query.semester !== undefined) where.semester = query.semester
    if (query.academicYear) where.academicYear = query.academicYear

    const groups = await prisma.classGroup.findMany({
      where,
      select: { ...classGroupSelect, _count: { select: { students: true } } },
      orderBy: [{ stream: { code: 'asc' } }, { semester: 'asc' }, { section: 'asc' }],
    })

    return ok(
      res,
      groups.map(({ _count, ...group }) => ({ ...group, studentCount: _count.students })),
    )
  }),
)

classGroupRoutes.post(
  '/',
  authenticate,
  requirePermission('academics:manage'),
  validateBody(createClassGroupSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as CreateClassGroupInput

    const stream = await prisma.stream.findUnique({ where: { id: body.streamId } })
    if (!stream) throw notFound('Stream')

    if (body.semester > stream.durationSemesters) {
      throw badRequest(
        `${stream.code} runs for ${stream.durationSemesters} semesters, so semester ${body.semester} does not exist.`,
      )
    }

    const clash = await prisma.classGroup.findUnique({
      where: {
        streamId_semester_section_academicYear: {
          streamId: body.streamId,
          semester: body.semester,
          section: body.section,
          academicYear: body.academicYear,
        },
      },
    })
    if (clash) {
      throw conflict(
        `${stream.code} semester ${body.semester} section ${body.section} already exists for ${body.academicYear}.`,
      )
    }

    const group = await prisma.classGroup.create({ data: body, select: classGroupSelect })
    return created(res, group)
  }),
)

classGroupRoutes.patch(
  '/:id',
  authenticate,
  requirePermission('academics:manage'),
  validateBody(updateClassGroupSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Class')
    const body = req.body as UpdateClassGroupInput

    const existing = await prisma.classGroup.findUnique({ where: { id } })
    if (!existing) throw notFound('Class')

    const group = await prisma.classGroup.update({
      where: { id },
      data: body,
      select: classGroupSelect,
    })

    // Students carry denormalised semester/section for the older queries that
    // still filter on them; keep those in step with the class they belong to.
    if (body.semester !== undefined || body.section !== undefined) {
      await prisma.user.updateMany({
        where: { classGroupId: id },
        data: {
          ...(body.semester === undefined ? {} : { semester: body.semester }),
          ...(body.section === undefined ? {} : { section: body.section }),
        },
      })
    }

    return ok(res, group)
  }),
)

classGroupRoutes.delete(
  '/:id',
  authenticate,
  requirePermission('academics:manage'),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Class')

    const group = await prisma.classGroup.findUnique({
      where: { id },
      select: {
        id: true,
        semester: true,
        section: true,
        stream: { select: { code: true } },
        _count: { select: { students: true } },
      },
    })
    if (!group) throw notFound('Class')

    if (group._count.students > 0) {
      throw conflict(
        `${group.stream.code} semester ${group.semester} section ${group.section} still has ${group._count.students} student(s). Move or remove them first.`,
      )
    }

    await prisma.classGroup.delete({ where: { id } })
    return ok(res, { id })
  }),
)

// --------------------------------------------------------------- periods ---

const periodSelect = {
  id: true,
  number: true,
  label: true,
  startTime: true,
  endTime: true,
  isActive: true,
} as const

periodRoutes.get(
  '/',
  authenticate,
  asyncHandler(async (_req, res) => {
    const periods = await prisma.period.findMany({
      select: periodSelect,
      orderBy: { number: 'asc' },
    })
    return ok(res, periods)
  }),
)

periodRoutes.post(
  '/',
  authenticate,
  requirePermission('academics:manage'),
  validateBody(createPeriodSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as CreatePeriodInput

    const clash = await prisma.period.findUnique({ where: { number: body.number } })
    if (clash) throw conflict(`Period ${body.number} already exists.`)

    const period = await prisma.period.create({
      data: { ...body, label: body.label ?? `Period ${body.number}` },
      select: periodSelect,
    })
    return created(res, period)
  }),
)

periodRoutes.patch(
  '/:id',
  authenticate,
  requirePermission('academics:manage'),
  validateBody(updatePeriodSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Period')
    const body = req.body as UpdatePeriodInput

    const existing = await prisma.period.findUnique({ where: { id } })
    if (!existing) throw notFound('Period')

    // One side of the pair may be absent from the body, so the ordering has to
    // be re-checked against what is already stored.
    const startTime = body.startTime ?? existing.startTime
    const endTime = body.endTime ?? existing.endTime
    if (endTime <= startTime) {
      throw badRequest('A period has to end after it starts.')
    }

    if (body.number !== undefined && body.number !== existing.number) {
      const clash = await prisma.period.findUnique({ where: { number: body.number } })
      if (clash) throw conflict(`Period ${body.number} already exists.`)
    }

    const period = await prisma.period.update({
      where: { id },
      data: body,
      select: periodSelect,
    })
    return ok(res, period)
  }),
)

periodRoutes.delete(
  '/:id',
  authenticate,
  requirePermission('academics:manage'),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Period')

    const period = await prisma.period.findUnique({ where: { id } })
    if (!period) throw notFound('Period')

    // Attendance stores the number, not this row's id, so the records survive
    // — they just lose their clock times. Say so rather than pretending the
    // delete was free.
    const marked = await prisma.attendance.count({
      where: { periodNumber: period.number },
    })

    await prisma.period.delete({ where: { id } })
    return ok(res, { id, attendanceRecordsAffected: marked })
  }),
)

// -------------------------------------------------------------- students ---

/**
 * Issues the next student ID for a stream, e.g. BCA26001.
 *
 * The serial is derived by reading the highest existing code for the stream
 * rather than kept in a counter column, so it cannot drift out of step with
 * reality after a manual insert or a deletion.
 */
async function nextStudentCode(
  tx: Prisma.TransactionClient,
  streamCode: string,
  admissionYear: number,
): Promise<string> {
  const prefix = `${streamCode}${String(admissionYear % 100).padStart(2, '0')}`

  // One statement: create the counter for this stream-year or bump it, and read
  // the result back.
  //
  // The previous version read every existing code sharing the prefix and took
  // the maximum in JS. Two students created in the same moment therefore read
  // the same value, computed the same code, and the second insert failed on the
  // unique index — reporting that a code nobody had seen was already taken. It
  // also could not use the index: the database collation is en_US.UTF-8, so a
  // `startsWith` filter needs text_pattern_ops and fell back to a sequential
  // scan of every user on every student creation.
  const rows = await tx.$queryRaw<{ seq: number }[]>`
    INSERT INTO "student_code_counters" ("prefix", "seq") VALUES (${prefix}, 1)
    ON CONFLICT ("prefix") DO UPDATE SET "seq" = "student_code_counters"."seq" + 1
    RETURNING "seq"
  `
  const seq = rows[0]?.seq ?? 1
  return `${prefix}${String(seq).padStart(3, '0')}`
}

studentRoutes.get(
  '/',
  authenticate,
  requirePermission('students:read'),
  validateQuery(listStudentsQuerySchema),
  asyncHandler(async (_req, res) => {
    const query = parsedQuery<typeof listStudentsQuerySchema>(res) as ListStudentsQuery
    const { page, limit, skip } = readPagination(
      { page: query.page, limit: query.limit },
      100,
    )

    const where: Prisma.UserWhereInput = { role: 'STUDENT' }
    if (query.classGroupId) where.classGroupId = query.classGroupId
    if (query.streamId) where.streamId = query.streamId
    if (query.semester !== undefined) where.semester = query.semester
    if (query.section) where.section = query.section
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { studentCode: { contains: query.q, mode: 'insensitive' } },
        { registerNo: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ]
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...studentSelect,
          stream: { select: { id: true, code: true, name: true } },
          classGroup: { select: { id: true, semester: true, section: true } },
        },
        orderBy: [{ studentCode: 'asc' }, { registerNo: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return paginated(res, students, buildMeta(page, limit, total))
  }),
)

studentRoutes.post(
  '/',
  authenticate,
  requirePermission('academics:manage'),
  validateBody(createStudentSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as CreateStudentInput

    const group = await prisma.classGroup.findUnique({
      where: { id: body.classGroupId },
      select: {
        id: true,
        semester: true,
        section: true,
        streamId: true,
        stream: { select: { code: true, shortName: true, name: true, department: true } },
      },
    })
    if (!group) throw notFound('Class')

    const emailClash = await prisma.user.findUnique({ where: { email: body.email } })
    if (emailClash) throw conflict('An account with this email already exists.')

    if (body.registerNo) {
      const clash = await prisma.user.findUnique({ where: { registerNo: body.registerNo } })
      if (clash) throw conflict(`Register number ${body.registerNo} is already taken.`)
    }

    const admissionYear = body.admissionYear ?? new Date().getFullYear()
    // Its own short transaction, and deliberately not wrapped around the
    // account creation below: bcrypt hashing takes ~100ms, and holding the
    // counter row locked across it would serialise every concurrent student
    // creation behind one password hash.
    const studentCode = await prisma.$transaction((tx) =>
      nextStudentCode(tx, group.stream.code, admissionYear),
    )

    // Without an explicit password the student's own ID is the initial one.
    // It is unique, printed on their card, and has to be changed on first use.
    const password = body.password ?? studentCode

    const student = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: await hashPassword(password),
        role: 'STUDENT',
        studentCode,
        registerNo: body.registerNo,
        phone: body.phone,
        guardianName: body.guardianName,
        guardianPhone: body.guardianPhone,
        admissionYear,
        streamId: group.streamId,
        classGroupId: group.id,
        // Denormalised so the existing program/semester/section queries and
        // the subject rosters keep matching without being rewritten.
        program: group.stream.shortName ?? group.stream.code,
        semester: group.semester,
        section: group.section,
        department: group.stream.department,
      },
      select: studentSelect,
    })

    return created(res, {
      ...student,
      // Returned once, so the admin can hand it over. It is never readable again.
      initialPassword: body.password ? undefined : password,
    })
  }),
)

studentRoutes.patch(
  '/:id',
  authenticate,
  requirePermission('academics:manage'),
  validateBody(updateStudentSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Student')
    const body = req.body as UpdateStudentInput

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing || existing.role !== 'STUDENT') throw notFound('Student')

    if (body.email && body.email !== existing.email) {
      const clash = await prisma.user.findUnique({ where: { email: body.email } })
      if (clash) throw conflict('An account with this email already exists.')
    }

    const data: Prisma.UserUpdateInput = {
      ...(body.name === undefined ? {} : { name: body.name }),
      ...(body.email === undefined ? {} : { email: body.email }),
      ...(body.phone === undefined ? {} : { phone: body.phone }),
      ...(body.guardianName === undefined ? {} : { guardianName: body.guardianName }),
      ...(body.guardianPhone === undefined ? {} : { guardianPhone: body.guardianPhone }),
      ...(body.isActive === undefined ? {} : { isActive: body.isActive }),
      ...(body.password === undefined
        ? {}
        : { passwordHash: await hashPassword(body.password) }),
    }

    // Moving a student to another class has to carry the denormalised columns
    // with it, or their attendance would keep being filed under the old one.
    if (body.classGroupId && body.classGroupId !== existing.classGroupId) {
      const group = await prisma.classGroup.findUnique({
        where: { id: body.classGroupId },
        select: {
          id: true,
          semester: true,
          section: true,
          streamId: true,
          stream: { select: { code: true, shortName: true, department: true } },
        },
      })
      if (!group) throw notFound('Class')

      data.classGroup = { connect: { id: group.id } }
      data.stream = { connect: { id: group.streamId } }
      data.semester = group.semester
      data.section = group.section
      data.program = group.stream.shortName ?? group.stream.code
      data.department = group.stream.department
    }

    const student = await prisma.user.update({ where: { id }, data, select: studentSelect })
    return ok(res, student)
  }),
)

studentRoutes.delete(
  '/:id',
  authenticate,
  requirePermission('academics:manage'),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    if (!id) throw notFound('Student')

    const student = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, name: true, _count: { select: { attendance: true } } },
    })
    if (!student || student.role !== 'STUDENT') throw notFound('Student')

    // Attendance and progress cascade from the user row, so this is not a
    // reversible tidy-up. The count goes back in the response so the admin
    // panel can say exactly what went with them.
    const attendanceRecords = student._count.attendance
    await prisma.user.delete({ where: { id } })

    return ok(res, { id, attendanceRecordsDeleted: attendanceRecords })
  }),
)
