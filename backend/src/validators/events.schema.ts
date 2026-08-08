import { z } from 'zod'

/**
 * Query strings arrive as strings, JSON bodies as real types, and HTML forms as
 * strings again. These primitives accept every reasonable spelling and hand the
 * handlers already-typed values.
 */
const dateTime = z
  .union([z.string(), z.number(), z.date()])
  .transform((value, ctx) => {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Expected an ISO-8601 date-time.',
      })
      return z.NEVER
    }
    return date
  })

const flag = z
  .union([z.boolean(), z.string()])
  .transform((value) =>
    typeof value === 'boolean'
      ? value
      : ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase()),
  )
  .optional()

/** Blank query params (`?q=`) mean "not filtering", not "match the empty string". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))

const shortText = (max: number) => z.string().trim().min(1).max(max)

/**
 * `coverImage` may be a relative asset path, so an absolute http(s) URL cannot
 * be required — but the schemes that execute when rendered into an `href` or
 * `src` are rejected outright.
 */
const DANGEROUS_SCHEME = /^\s*(javascript|data|vbscript|file)\s*:/i

const imageRef = (max: number) =>
  shortText(max).refine(
    (value) => !DANGEROUS_SCHEME.test(value),
    'Image URL must be a plain path or an http(s) URL.',
  )

const pageQuery = {
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
}

// ------------------------------------------------------------------ query ---

export const listEventsQuerySchema = z.object({
  ...pageQuery,
  upcoming: flag,
  past: flag,
  includeUnpublished: flag,
  category: optionalText(60),
  q: optionalText(120),
})

export const paginationQuerySchema = z.object(pageQuery)

// ------------------------------------------------------------------- body ---

const eventFields = z.object({
  title: shortText(200),
  slug: shortText(120).optional(),
  description: z.string().trim().min(1).max(20000),
  category: shortText(60).optional(),
  startsAt: dateTime,
  endsAt: dateTime.nullable().optional(),
  venue: shortText(200).nullable().optional(),
  coverImage: imageRef(500).nullable().optional(),
  fee: z.coerce.number().int().min(0).max(1_000_000).optional(),
  capacity: z.coerce.number().int().positive().max(1_000_000).nullable().optional(),
  registrationOpen: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  organizer: shortText(200).nullable().optional(),
  contactName: shortText(120).nullable().optional(),
  contactEmail: z.string().trim().toLowerCase().email().max(160).nullable().optional(),
  contactPhone: shortText(30).nullable().optional(),
})

const endsAfterStart = (
  value: { startsAt?: Date; endsAt?: Date | null },
  ctx: z.RefinementCtx,
) => {
  if (value.startsAt && value.endsAt && value.endsAt.getTime() <= value.startsAt.getTime()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endsAt'],
      message: 'endsAt must be after startsAt.',
    })
  }
}

export const createEventSchema = eventFields.superRefine(endsAfterStart)

export const updateEventSchema = eventFields
  .partial()
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body'],
        message: 'Provide at least one field to update.',
      })
    }
    endsAfterStart(value, ctx)
  })

/**
 * `name` and `email` are optional here because a signed-in registrant inherits
 * them from their account; the handler rejects an anonymous body that omits
 * them.
 */
export const registerForEventSchema = z.object({
  name: shortText(120).optional(),
  email: z.string().trim().toLowerCase().email().max(160).optional(),
  phone: shortText(30).nullable().optional(),
  college: shortText(200).nullable().optional(),
  teamName: shortText(120).nullable().optional(),
  teamMembers: shortText(1000).nullable().optional(),
})

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type RegisterForEventInput = z.infer<typeof registerForEventSchema>
