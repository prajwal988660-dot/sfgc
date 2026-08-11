import { z } from 'zod'

/**
 * Validation for the structural side of the college: streams, the class groups
 * inside them, the daily period timetable, and the students filed into a class.
 */

const text = (max: number) => z.string().trim().min(1).max(max)

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))

/** Blank means "clear this column", which is different from "leave it alone". */
const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))

const idSchema = z.string().trim().min(1, 'An id is required.')

export const semesterSchema = z.coerce
  .number()
  .int('A semester is a whole number.')
  .min(1, 'Semesters start at 1.')
  .max(12, 'A semester above 12 is not a real course.')

/** "A", "B" … Upper-cased so "a" and "A" cannot become two sections. */
const sectionSchema = z
  .string()
  .trim()
  .min(1, 'A section is required.')
  .max(4, 'A section name is at most 4 characters.')
  .transform((value) => value.toUpperCase())

const academicYearSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, 'Use the form 2026-27.')

// --------------------------------------------------------------- stream ----

/**
 * The code prefixes every student ID in the stream, so it is constrained hard:
 * letters and digits only, upper-cased. "B.Com" arrives and becomes "BCOM",
 * which is what makes BCOM26001 readable.
 */
const streamCodeSchema = z
  .string()
  .trim()
  .min(2, 'A stream code needs at least 2 characters.')
  .max(10, 'A stream code is at most 10 characters.')
  .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
  .refine((value) => value.length >= 2, 'A stream code needs at least 2 letters or digits.')

export const createStreamSchema = z.object({
  code: streamCodeSchema,
  name: text(160),
  shortName: nullableText(40),
  department: nullableText(120),
  durationSemesters: z.coerce.number().int().min(1).max(12).default(6),
  isActive: z.boolean().default(true),
})

export const updateStreamSchema = createStreamSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Provide at least one field to update.',
)

// ---------------------------------------------------------- class group ----

export const createClassGroupSchema = z.object({
  streamId: idSchema,
  semester: semesterSchema,
  section: sectionSchema,
  academicYear: academicYearSchema.default('2026-27'),
})

export const updateClassGroupSchema = z
  .object({
    semester: semesterSchema.optional(),
    section: sectionSchema.optional(),
    academicYear: academicYearSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.')

export const listClassGroupsQuerySchema = z.object({
  streamId: idSchema.optional(),
  semester: semesterSchema.optional(),
  academicYear: academicYearSchema.optional(),
})

// --------------------------------------------------------------- period ----

/** 24-hour "HH:mm". Compared as strings elsewhere, which only works zero-padded. */
const clockTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time like 09:00 or 14:30.')

export const createPeriodSchema = z
  .object({
    number: z.coerce.number().int().min(1).max(12),
    label: nullableText(40),
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    isActive: z.boolean().default(true),
  })
  .refine(
    (value) => value.endTime > value.startTime,
    { message: 'A period has to end after it starts.', path: ['endTime'] },
  )

export const updatePeriodSchema = z
  .object({
    number: z.coerce.number().int().min(1).max(12).optional(),
    label: nullableText(40),
    startTime: clockTimeSchema.optional(),
    endTime: clockTimeSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.')
  .refine(
    // Only checkable when both arrive together; a one-sided edit is validated
    // against the stored row in the handler, which is the only place the other
    // half of the pair is known.
    (value) =>
      !value.startTime || !value.endTime || value.endTime > value.startTime,
    { message: 'A period has to end after it starts.', path: ['endTime'] },
  )

// -------------------------------------------------------------- student ----

export const createStudentSchema = z.object({
  name: text(120),
  email: z.string().trim().toLowerCase().email('That is not a valid email.').max(160),
  /// Optional: left out, the API generates one from the class's stream.
  password: z
    .string()
    .min(6, 'A password needs at least 6 characters.')
    .max(200)
    .optional(),
  classGroupId: idSchema,
  phone: nullableText(30),
  guardianName: nullableText(120),
  guardianPhone: nullableText(30),
  admissionYear: z.coerce.number().int().min(1990).max(2100).optional(),
  /// The old college register number, when the student already has one.
  registerNo: nullableText(40),
})

export const updateStudentSchema = z
  .object({
    name: text(120).optional(),
    email: z.string().trim().toLowerCase().email().max(160).optional(),
    classGroupId: idSchema.optional(),
    phone: nullableText(30),
    guardianName: nullableText(120),
    guardianPhone: nullableText(30),
    isActive: z.boolean().optional(),
    /// Setting a new password for a student who has forgotten theirs.
    password: z.string().min(6).max(200).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.')

export const listStudentsQuerySchema = z.object({
  classGroupId: idSchema.optional(),
  streamId: idSchema.optional(),
  semester: semesterSchema.optional(),
  section: optionalText(4),
  q: optionalText(120),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

export type CreateStreamInput = z.infer<typeof createStreamSchema>
export type UpdateStreamInput = z.infer<typeof updateStreamSchema>
export type CreateClassGroupInput = z.infer<typeof createClassGroupSchema>
export type UpdateClassGroupInput = z.infer<typeof updateClassGroupSchema>
export type ListClassGroupsQuery = z.infer<typeof listClassGroupsQuerySchema>
export type CreatePeriodInput = z.infer<typeof createPeriodSchema>
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>
export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>
