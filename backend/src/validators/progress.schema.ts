import { z } from 'zod'

/** Matches the `academicYear` default carried by the Prisma schema. */
export const DEFAULT_ACADEMIC_YEAR = '2026-27'

const academicYear = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2,4}$/, 'Use an academic year like "2026-27".')

const semester = z
  .number()
  .int('Semester must be a whole number.')
  .min(1, 'Semester must be between 1 and 12.')
  .max(12, 'Semester must be between 1 and 12.')

const marks = z
  .number()
  .int('Marks must be a whole number.')
  .min(0, 'Marks cannot be negative.')
  .max(1000, 'Marks look implausibly large.')

/**
 * `?semester=3` arrives as a string, and `?semester=` (a cleared filter in the
 * apps) must read as "not supplied" rather than as zero.
 */
const querySemester = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.coerce
    .number()
    .int('Semester must be a whole number.')
    .min(1, 'Semester must be between 1 and 12.')
    .max(12, 'Semester must be between 1 and 12.')
    .optional(),
)

export const progressQuerySchema = z.object({
  semester: querySemester,
  academicYear: academicYear.default(DEFAULT_ACADEMIC_YEAR),
})

/**
 * A mark is only written when the key is present: `undefined` leaves whatever
 * is already stored alone (so entering externals later does not wipe the
 * internals), while an explicit `null` clears the value.
 */
export const progressRecordSchema = z.object({
  studentId: z.string().trim().min(1, 'studentId is required.'),
  internalMarks: marks.nullish(),
  externalMarks: marks.nullish(),
  remarks: z.string().trim().max(500, 'Remarks are limited to 500 characters.').nullish(),
})

export const createProgressSchema = z.object({
  subjectId: z.string().trim().min(1, 'subjectId is required.'),
  semester,
  academicYear: academicYear.default(DEFAULT_ACADEMIC_YEAR),
  isPublished: z.boolean().optional(),
  maxInternal: z
    .number()
    .int('maxInternal must be a whole number.')
    .min(0, 'maxInternal cannot be negative.')
    .max(1000, 'maxInternal looks implausibly large.')
    .optional(),
  maxExternal: z
    .number()
    .int('maxExternal must be a whole number.')
    .min(0, 'maxExternal cannot be negative.')
    .max(1000, 'maxExternal looks implausibly large.')
    .optional(),
  records: z
    .array(progressRecordSchema)
    .min(1, 'Send at least one record.')
    .max(300, 'Send at most 300 records per request.'),
})

export type ProgressQuery = z.infer<typeof progressQuerySchema>
export type ProgressRecordInput = z.infer<typeof progressRecordSchema>
export type CreateProgressBody = z.infer<typeof createProgressSchema>
