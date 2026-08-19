import { z } from 'zod'

/**
 * Photographs shown on the public site.
 */

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

/**
 * The image link.
 *
 * `z.string().url()` alone accepts `javascript:` and `data:`, which become
 * stored XSS the moment this is rendered into a `src` or an `href`. The scheme
 * is pinned to http(s), matching how notice attachments and study materials are
 * already validated.
 */
const imageUrlSchema = z
  .string()
  .trim()
  .url('That is not a valid link.')
  .max(2000)
  .refine(
    (value) => /^https?:\/\//i.test(value),
    'The image link must start with http:// or https://',
  )

const galleryBase = z.object({
  title: z.string().trim().min(2, 'A title is required.').max(160),
  caption: nullableText(500),
  imageUrl: imageUrlSchema,
  altText: nullableText(300),
  album: z.string().trim().min(1).max(80).default('Campus'),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
  isPublished: z.boolean().default(true),
})

export const createGalleryImageSchema = galleryBase

export const updateGalleryImageSchema = galleryBase
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.')

export const listGalleryQuerySchema = z.object({
  album: optionalText(80),
  q: optionalText(120),
  /// Staff only; the handler ignores it for everyone else.
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

export type CreateGalleryImageInput = z.infer<typeof createGalleryImageSchema>
export type UpdateGalleryImageInput = z.infer<typeof updateGalleryImageSchema>
export type ListGalleryQuery = z.infer<typeof listGalleryQuerySchema>
