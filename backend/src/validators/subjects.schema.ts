import { z } from 'zod'

/**
 * Query strings arrive as text, so flags cannot rely on `z.boolean()`. JSON
 * bodies do send real booleans, hence the union.
 */
const boolish = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1')

const id = z.string().trim().min(1, 'An id is required.').max(64)

const dateKey = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a calendar date in YYYY-MM-DD form.')

const code = z
  .string()
  .trim()
  .min(2, 'Subject code is too short.')
  .max(32, 'Subject code is too long.')
  .transform((value) => value.toUpperCase())

const name = z.string().trim().min(2, 'Subject name is too short.').max(160)
const program = z.string().trim().min(1, 'Program is required.').max(64)
const semester = z.coerce.number().int().min(1).max(12)
const section = z.string().trim().min(1).max(8)
const credits = z.coerce.number().int().min(0).max(20)
const department = z.string().trim().min(1).max(120)
const academicYear = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, 'Expected an academic year like "2026-27".')

/** Duplicate ids in one payload would otherwise inflate the enrolled count. */
const studentIdList = z
  .array(id)
  .max(500, 'Enrol at most 500 students in one request.')
  .transform((ids) => Array.from(new Set(ids)))

export const listSubjectsQuerySchema = z.object({
  program: program.optional(),
  semester: semester.optional(),
  section: section.optional(),
  teacherId: id.optional(),
  all: boolish.optional(),
})

export const rosterQuerySchema = z.object({
  date: dateKey.optional(),
})

export const createSubjectSchema = z.object({
  code,
  name,
  program,
  semester,
  section: section.nullable().optional(),
  credits: credits.optional(),
  department: department.nullable().optional(),
  academicYear: academicYear.optional(),
  isActive: boolish.optional(),
  teacherId: id.nullable().optional(),
  studentIds: studentIdList.optional(),
})

export const updateSubjectSchema = z
  .object({
    code: code.optional(),
    name: name.optional(),
    program: program.optional(),
    semester: semester.optional(),
    section: section.nullable().optional(),
    credits: credits.optional(),
    department: department.nullable().optional(),
    academicYear: academicYear.optional(),
    isActive: boolish.optional(),
    teacherId: id.nullable().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Provide at least one field to update.',
  })

export const enrollStudentsSchema = z.object({
  studentIds: studentIdList.refine(
    (ids) => ids.length > 0,
    'Provide at least one student id.',
  ),
})

export type ListSubjectsQuery = z.infer<typeof listSubjectsQuerySchema>
export type RosterQuery = z.infer<typeof rosterQuerySchema>
export type CreateSubjectBody = z.infer<typeof createSubjectSchema>
export type UpdateSubjectBody = z.infer<typeof updateSubjectSchema>
export type EnrollStudentsBody = z.infer<typeof enrollStudentsSchema>
