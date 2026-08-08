import { z } from 'zod'

/**
 * Zod schemas for `/auth`. Every schema both validates *and* normalises, so a
 * handler never has to trim, lowercase or re-check anything it receives.
 */

// ---------------------------------------------------------------- helpers ---

/** Blank strings and explicit nulls are treated as "field not supplied". */
const blankToUndefined = (value: unknown): unknown =>
  value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value

/** Optional field that tolerates `""` / `null` from HTML forms and RN inputs. */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(blankToUndefined, schema.optional())

/** Optional field where `""` / `null` explicitly means "clear this value". */
const clearable = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    schema.nullable().optional(),
  )

const text = (max: number, label: string) =>
  z
    .string({
      required_error: `${label} is required.`,
      invalid_type_error: `${label} must be text.`,
    })
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)

/** Register numbers and employee ids: no spaces, so they stay easy to type. */
const code = (max: number, label: string) =>
  text(max, label)
    .min(2, `${label} must be at least 2 characters.`)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, `${label} may only contain letters, numbers and . _ / -`)

// ----------------------------------------------------------------- fields ---

const nameField = text(120, 'Name').min(2, 'Name must be at least 2 characters.')

const emailField = z
  .string({ required_error: 'Email is required.', invalid_type_error: 'Email must be text.' })
  .trim()
  .toLowerCase()
  .max(160, 'Email must be at most 160 characters.')
  .email('Enter a valid email address.')

// bcrypt only considers the first 72 bytes, so anything longer is a false
// sense of security rather than a stronger password.
const passwordField = z
  .string({ required_error: 'Password is required.', invalid_type_error: 'Password must be text.' })
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.')

const phoneField = text(20, 'Phone')
  .min(7, 'Enter a valid phone number.')
  .regex(/^\+?[0-9][0-9 ()-]*$/, 'Enter a valid phone number.')

const avatarUrlField = text(500, 'Avatar URL')
  .url('Enter a valid image URL.')
  // z.string().url() happily accepts `javascript:` and `data:` URLs.
  .refine((value) => /^https?:\/\//i.test(value), 'Avatar URL must start with http:// or https://')

const semesterField = z.coerce
  .number({ invalid_type_error: 'Semester must be a number.' })
  .int('Semester must be a whole number.')
  .min(1, 'Semester must be between 1 and 12.')
  .max(12, 'Semester must be between 1 and 12.')

// --------------------------------------------------------------- register ---

const registerBase = {
  name: nameField,
  email: emailField,
  password: passwordField,
  phone: optional(phoneField),
  department: optional(text(120, 'Department')),
}

const studentRegisterSchema = z.object({
  ...registerBase,
  role: z.literal('STUDENT'),
  registerNo: code(40, 'Register number'),
  program: optional(text(80, 'Program')),
  semester: optional(semesterField),
  section: optional(text(10, 'Section')),
})

const teacherRegisterSchema = z.object({
  ...registerBase,
  role: z.literal('TEACHER'),
  employeeId: code(40, 'Employee id'),
  designation: optional(text(120, 'Designation')),
})

/** Accepted by the schema only so the route can answer with a clear 403. */
const adminRegisterSchema = z.object({
  ...registerBase,
  role: z.literal('ADMIN'),
})

/**
 * `role` defaults to STUDENT and is case-insensitive; the branch it selects
 * decides whether `registerNo` or `employeeId` is mandatory.
 */
export const registerSchema = z.preprocess((value) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value
  const body = value as Record<string, unknown>
  const role = body.role
  if (role === undefined || role === null || role === '') return { ...body, role: 'STUDENT' }
  if (typeof role === 'string') return { ...body, role: role.trim().toUpperCase() }
  return value
}, z.discriminatedUnion('role', [studentRegisterSchema, teacherRegisterSchema, adminRegisterSchema]))

export type RegisterBody = z.infer<typeof registerSchema>

// ------------------------------------------------------------------ login ---

export const loginSchema = z.object({
  identifier: text(160, 'Email, register number or employee id').min(
    1,
    'Enter your email, register number or employee id.',
  ),
  password: z
    .string({ required_error: 'Password is required.', invalid_type_error: 'Password must be text.' })
    .min(1, 'Enter your password.')
    .max(200, 'Password must be at most 200 characters.'),
})

export type LoginBody = z.infer<typeof loginSchema>

// -------------------------------------------------------------- update me ---

export const updateMeSchema = z
  .object({
    name: optional(nameField),
    phone: clearable(phoneField),
    avatarUrl: clearable(avatarUrlField),
  })
  .refine(
    (body) =>
      body.name !== undefined || body.phone !== undefined || body.avatarUrl !== undefined,
    { message: 'Provide at least one of name, phone or avatarUrl.' },
  )

export type UpdateMeBody = z.infer<typeof updateMeSchema>

// -------------------------------------------------------------- push token ---

export const pushTokenSchema = z.object({
  expoPushToken: text(200, 'Push token').regex(
    /^(ExponentPushToken|ExpoPushToken)\[[^\]\s]+\]$/,
    'Not a valid Expo push token.',
  ),
})

export type PushTokenBody = z.infer<typeof pushTokenSchema>
