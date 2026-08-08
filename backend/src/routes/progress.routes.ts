import { Router } from 'express'

import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { ok } from '../lib/respond'
import {
  badRequest,
  forbidden,
  notFound,
  unauthenticated,
  type ApiErrorDetail,
} from '../lib/errors'
import { authenticate, requireRole, requireSelfOrStaff } from '../middleware/auth'
import { validateBody, validateQuery, parsedQuery } from '../middleware/validate'
import { computeSummary, gradeFor, rowPercentage } from '../lib/grading'
import {
  createProgressSchema,
  progressQuerySchema,
  type CreateProgressBody,
  type ProgressQuery,
} from '../validators/progress.schema'

const router = Router()

/** Mirrors the column defaults in `prisma/schema.prisma`. */
const DEFAULT_MAX_INTERNAL = 40
const DEFAULT_MAX_EXTERNAL = 60

/** The columns a mark-entry request writes; shared by the create and update halves of the upsert. */
interface ProgressValues {
  internalMarks: number | null
  externalMarks: number | null
  maxInternal: number
  maxExternal: number
  grade: string
  credits: number
  recordedById: string
  remarks?: string | null
  isPublished?: boolean
}

/**
 * Builds the progress card documented in API_CONTRACT.md.
 *
 * `includeUnpublished` is what keeps a student from reading marks the teacher
 * has entered but not released; staff always see everything.
 */
async function buildProgressCard(
  studentId: string,
  query: ProgressQuery,
  includeUnpublished: boolean,
) {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      role: true,
      registerNo: true,
      program: true,
      semester: true,
      section: true,
    },
  })
  if (!student || student.role !== 'STUDENT') throw notFound('Student')

  // No explicit semester: show the one the student is currently in. Students
  // without a semester on record get every semester of the year instead.
  const semester = query.semester ?? student.semester ?? null

  const rows = await prisma.progressCard.findMany({
    where: {
      studentId: student.id,
      academicYear: query.academicYear,
      ...(semester === null ? {} : { semester }),
      ...(includeUnpublished ? {} : { isPublished: true }),
    },
    orderBy: [{ semester: 'asc' }, { subject: { code: 'asc' } }],
    select: {
      id: true,
      internalMarks: true,
      maxInternal: true,
      externalMarks: true,
      maxExternal: true,
      credits: true,
      remarks: true,
      isPublished: true,
      subject: { select: { id: true, code: true, name: true } },
    },
  })

  return {
    student: {
      id: student.id,
      name: student.name,
      registerNo: student.registerNo,
      program: student.program,
      semester: student.semester,
      section: student.section,
    },
    semester,
    academicYear: query.academicYear,
    rows: rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      internalMarks: row.internalMarks,
      maxInternal: row.maxInternal,
      externalMarks: row.externalMarks,
      maxExternal: row.maxExternal,
      total: (row.internalMarks ?? 0) + (row.externalMarks ?? 0),
      maxTotal: row.maxInternal + row.maxExternal,
      // Always derived, never the stored string: a stale `grade` column must
      // not contradict the marks sitting next to it on the card.
      grade: gradeFor(rowPercentage(row)).grade,
      credits: row.credits,
      remarks: row.remarks,
      isPublished: row.isPublished,
    })),
    summary: computeSummary(rows),
  }
}

router.get(
  '/me',
  authenticate,
  validateQuery(progressQuerySchema),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) throw unauthenticated()

    const query = parsedQuery<typeof progressQuerySchema>(res)
    const card = await buildProgressCard(user.id, query, user.role !== 'STUDENT')
    return ok(res, card)
  }),
)

router.get(
  '/:studentId',
  authenticate,
  requireSelfOrStaff('studentId'),
  validateQuery(progressQuerySchema),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) throw unauthenticated()

    const studentId = req.params.studentId
    if (!studentId) throw notFound('Student')

    const query = parsedQuery<typeof progressQuerySchema>(res)
    const card = await buildProgressCard(studentId, query, user.role !== 'STUDENT')
    return ok(res, card)
  }),
)

router.post(
  '/',
  authenticate,
  requireRole('TEACHER', 'ADMIN'),
  validateBody(createProgressSchema),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) throw unauthenticated()

    const body = req.body as CreateProgressBody

    const subject = await prisma.subject.findUnique({
      where: { id: body.subjectId },
      select: {
        id: true,
        credits: true,
        teacherId: true,
        students: { select: { id: true } },
      },
    })
    if (!subject) throw notFound('Subject')
    if (user.role === 'TEACHER' && subject.teacherId !== user.id) {
      throw forbidden('You can only record marks for a subject you teach.')
    }

    const studentIds = body.records.map((record) => record.studentId)

    const duplicates = [
      ...new Set(studentIds.filter((id, index) => studentIds.indexOf(id) !== index)),
    ]
    if (duplicates.length > 0) {
      throw badRequest(
        `Each student may appear only once per request. Repeated: ${duplicates.join(', ')}.`,
        duplicates.map((id) => ({ path: 'records', message: `${id} appears more than once.` })),
      )
    }

    const enrolled = new Set(subject.students.map((student) => student.id))
    const notEnrolled = studentIds.filter((id) => !enrolled.has(id))
    if (notEnrolled.length > 0) {
      throw badRequest(
        `These students are not enrolled in this subject: ${notEnrolled.join(', ')}.`,
        notEnrolled.map((id) => ({ path: 'records', message: `${id} is not enrolled.` })),
      )
    }

    const existing = await prisma.progressCard.findMany({
      where: {
        subjectId: subject.id,
        semester: body.semester,
        academicYear: body.academicYear,
        studentId: { in: studentIds },
      },
      select: {
        studentId: true,
        internalMarks: true,
        externalMarks: true,
        maxInternal: true,
        maxExternal: true,
      },
    })
    const priorByStudent = new Map(existing.map((row) => [row.studentId, row] as const))

    const issues: ApiErrorDetail[] = []
    const pending: Array<{ studentId: string; values: ProgressValues }> = []

    for (const [index, record] of body.records.entries()) {
      const issuesBefore = issues.length
      const prior = priorByStudent.get(record.studentId)

      const maxInternal = body.maxInternal ?? prior?.maxInternal ?? DEFAULT_MAX_INTERNAL
      const maxExternal = body.maxExternal ?? prior?.maxExternal ?? DEFAULT_MAX_EXTERNAL

      // An omitted mark keeps whatever is already stored; an explicit null clears it.
      const internalMarks =
        record.internalMarks === undefined ? prior?.internalMarks ?? null : record.internalMarks
      const externalMarks =
        record.externalMarks === undefined ? prior?.externalMarks ?? null : record.externalMarks

      if (internalMarks !== null && internalMarks > maxInternal) {
        issues.push({
          path: `records.${index}.internalMarks`,
          message: `Cannot exceed maxInternal (${maxInternal}).`,
        })
      }
      if (externalMarks !== null && externalMarks > maxExternal) {
        issues.push({
          path: `records.${index}.externalMarks`,
          message: `Cannot exceed maxExternal (${maxExternal}).`,
        })
      }
      if (internalMarks !== null && internalMarks < 0) {
        issues.push({ path: `records.${index}.internalMarks`, message: 'Marks cannot be negative.' })
      }
      if (externalMarks !== null && externalMarks < 0) {
        issues.push({ path: `records.${index}.externalMarks`, message: 'Marks cannot be negative.' })
      }
      // Keep validating the remaining records so the client gets every problem at once.
      if (issues.length > issuesBefore) continue

      const values: ProgressValues = {
        internalMarks,
        externalMarks,
        maxInternal,
        maxExternal,
        grade: gradeFor(rowPercentage({ internalMarks, externalMarks, maxInternal, maxExternal }))
          .grade,
        credits: subject.credits,
        recordedById: user.id,
      }
      if (record.remarks !== undefined) values.remarks = record.remarks
      if (body.isPublished !== undefined) values.isPublished = body.isPublished

      pending.push({ studentId: record.studentId, values })
    }

    if (issues.length > 0) throw badRequest('Some marks are out of range.', issues)

    const saved = await prisma.$transaction(
      pending.map(({ studentId, values }) =>
        prisma.progressCard.upsert({
          where: {
            studentId_subjectId_semester_academicYear: {
              studentId,
              subjectId: subject.id,
              semester: body.semester,
              academicYear: body.academicYear,
            },
          },
          create: {
            studentId,
            subjectId: subject.id,
            semester: body.semester,
            academicYear: body.academicYear,
            ...values,
          },
          update: values,
          select: { id: true },
        }),
      ),
    )

    return ok(res, { saved: saved.length })
  }),
)

export default router
