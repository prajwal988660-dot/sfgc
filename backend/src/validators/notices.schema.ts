import { z } from 'zod'

export const noticeAudienceSchema = z.enum(['ALL', 'STUDENTS', 'TEACHERS'])

/**
 * Writable shape of a notice. `createNoticeSchema` applies the column defaults
 * so a create is always complete; `updateNoticeSchema` is the same shape made
 * partial, where an absent key means "leave it alone" and an explicit `null`
 * means "clear it".
 */
const noticeBaseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  body: z.string().trim().min(1, 'Body cannot be empty').max(20_000),
  category: z.string().trim().min(1).max(60).default('General'),
  audience: noticeAudienceSchema.default('ALL'),
  pinned: z.boolean().default(false),
  // z.string().url() accepts `javascript:` and `data:`, which become a stored
  // XSS payload the moment the site renders the attachment as a link.
  attachmentUrl: z
    .string()
    .trim()
    .url('Attachment must be a valid URL')
    .max(2000)
    .refine(
      (value) => /^https?:\/\//i.test(value),
      'Attachment URL must start with http:// or https://',
    )
    .nullish(),
  program: z.string().trim().min(1).max(60).nullish(),
  semester: z.coerce.number().int().min(1).max(12).nullish(),
  // `null` is folded into `undefined` so an explicit null keeps the column's
  // default (now) instead of coercing to the epoch.
  publishedAt: z.coerce
    .date()
    .nullish()
    .transform((value) => value ?? undefined),
  expiresAt: z.coerce.date().nullish(),
})

function checkWindow(
  value: { publishedAt?: Date | undefined; expiresAt?: Date | null | undefined },
  ctx: z.RefinementCtx,
): void {
  if (value.expiresAt && value.publishedAt && value.expiresAt <= value.publishedAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['expiresAt'],
      message: 'Expiry must be after the publish date.',
    })
  }
}

export const createNoticeSchema = noticeBaseSchema.superRefine(checkWindow)

export const updateNoticeSchema = noticeBaseSchema.partial().superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide at least one field to update.',
    })
  }
  checkWindow(value, ctx)
})

export const listNoticesQuerySchema = z.object({
  category: z.string().trim().min(1).max(60).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>
export type ListNoticesQuery = z.infer<typeof listNoticesQuerySchema>
