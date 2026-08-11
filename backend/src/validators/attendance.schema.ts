import { z } from 'zod'

/**
 * Attendance is keyed on a calendar day, not an instant. Everything on the
 * wire is `"YYYY-MM-DD"`; everything in the database is midnight UTC of that
 * day, which is how a Postgres `date` column round-trips through Prisma
 * without drifting into the neighbouring day.
 */
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/

/** A single request may not mark more students than a very large lecture hall. */
const MARK_RECORD_LIMIT = 500

/** Parses `"YYYY-MM-DD"` into midnight UTC, or `null` if it is not a real day. */
export function toCalendarDay(value: string): Date | null {
  if (!CALENDAR_DAY.test(value)) return null

  const parts = value.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])

  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(parsed.getTime())) return null

  // Rejects overflow like "2026-02-31", which Date.UTC would silently roll over.
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  return parsed
}

export function formatCalendarDay(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Today according to the server's local calendar, pinned to midnight UTC so it
 * matches the storage format. Local rather than UTC components so a college
 * running its server in IST does not file an 8 a.m. class under yesterday.
 */
export function todayCalendarDay(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

const calendarDaySchema = z
  .string()
  .trim()
  .regex(CALENDAR_DAY, 'Use the calendar-day format YYYY-MM-DD.')
  .refine((value) => toCalendarDay(value) !== null, 'That calendar day does not exist.')

const idSchema = z.string().trim().min(1, 'An id is required.')

export const attendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])

const attendanceRecordSchema = z.object({
  studentId: idSchema,
  status: attendanceStatusSchema,
  remarks: z
    .string()
    .trim()
    .max(280, 'Remarks cannot be longer than 280 characters.')
    .nullish()
    .transform((value) => (value ? value : null)),
})

/**
 * Which hour of the day the class ran. Defaults to 1 so a caller that predates
 * periods — the current teacher app build, for one — keeps working unchanged
 * instead of failing validation.
 */
export const periodNumberSchema = z.coerce
  .number()
  .int('A period is a whole number.')
  .min(1, 'Periods start at 1.')
  .max(12, 'A college day does not have more than 12 periods.')

export const markAttendanceSchema = z
  .object({
    subjectId: idSchema,
    date: calendarDaySchema.optional(),
    periodNumber: periodNumberSchema.default(1),
    records: z
      .array(attendanceRecordSchema)
      .min(1, 'Include at least one student to mark.')
      .max(
        MARK_RECORD_LIMIT,
        `A single request can mark at most ${MARK_RECORD_LIMIT} students.`,
      ),
  })
  .superRefine((value, ctx) => {
    // Two rows for one student would upsert over each other, so the caller's
    // intent is undefined — say so instead of silently keeping the last one.
    const seen = new Set<string>()
    value.records.forEach((record, index) => {
      if (seen.has(record.studentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['records', index, 'studentId'],
          message: 'This student appears more than once in the same request.',
        })
      }
      seen.add(record.studentId)
    })
  })

/** `YYYY-MM-DD` sorts lexicographically, so plain string comparison is enough. */
const orderedRange = (value: { from?: string; to?: string }) =>
  !value.from || !value.to || value.from <= value.to

const rangeIssue = { message: '`to` must be on or after `from`.', path: ['to'] }

export const studentAttendanceQuerySchema = z
  .object({
    subjectId: idSchema.optional(),
    from: calendarDaySchema.optional(),
    to: calendarDaySchema.optional(),
  })
  .refine(orderedRange, rangeIssue)

export const classAttendanceQuerySchema = z
  .object({
    date: calendarDaySchema.optional(),
    from: calendarDaySchema.optional(),
    to: calendarDaySchema.optional(),
    /// Narrows the roster read to one hour, so re-opening period 3 shows what
    /// was marked for period 3 rather than whatever was marked first that day.
    periodNumber: periodNumberSchema.optional(),
  })
  .refine(orderedRange, rangeIssue)

export type MarkAttendanceBody = z.infer<typeof markAttendanceSchema>
export type StudentAttendanceQuery = z.infer<typeof studentAttendanceQuerySchema>
export type ClassAttendanceQuery = z.infer<typeof classAttendanceQuerySchema>
