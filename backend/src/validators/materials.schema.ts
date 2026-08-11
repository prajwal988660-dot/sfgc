import { z } from 'zod'

/**
 * Study material for the student app's library — notes, question papers,
 * solved papers.
 */

export const materialKindSchema = z.enum([
  'NOTES',
  'QUESTION_PAPER',
  'SOLVED_PAPER',
  'SYLLABUS',
  'REFERENCE',
])

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))

const idSchema = z.string().trim().min(1)

/**
 * The file link. `z.string().url()` alone would accept `javascript:` and
 * `data:`, which become a stored XSS the moment the app renders this as a
 * tappable link — so the scheme is pinned to http(s).
 */
const fileUrlSchema = z
  .string()
  .trim()
  .url('That is not a valid link.')
  .max(2000)
  .refine(
    (value) => /^https?:\/\//i.test(value),
    'The link must start with http:// or https://',
  )

const materialBase = z.object({
  title: z.string().trim().min(2, 'A title is required.').max(200),
  description: nullableText(2000),
  kind: materialKindSchema.default('NOTES'),
  fileUrl: fileUrlSchema,
  fileLabel: nullableText(60),
  streamId: nullableText(60),
  semester: z.coerce.number().int().min(1).max(12).nullish(),
  subjectId: nullableText(60),
  isPublished: z.boolean().default(true),
})

export const createMaterialSchema = materialBase

export const updateMaterialSchema = materialBase
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.')

export const listMaterialsQuerySchema = z.object({
  streamId: idSchema.optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  subjectId: idSchema.optional(),
  kind: materialKindSchema.optional(),
  q: optionalText(120),
  /// Staff only; the handler ignores it for students.
  includeUnpublished: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) =>
      typeof value === 'boolean'
        ? value
        : ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase()),
    ),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>
export type ListMaterialsQuery = z.infer<typeof listMaterialsQuerySchema>
