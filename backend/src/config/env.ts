import 'dotenv/config'
import { z } from 'zod'

/**
 * Environment is validated once, at boot. A missing DATABASE_URL or a default
 * JWT secret in production is a hard failure — better a loud crash on start
 * than a silently insecure API.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (see .env.example)'),
  DIRECT_URL: z.string().optional(),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@sfgc.ac.in'),
  /**
   * No default, and validated nowhere here — deliberately, on both counts.
   *
   * No default, because the previous one ("Admin@123") is published in this
   * repository; anyone could read it and sign in to the admin panel.
   *
   * No constraints, because only `prisma/seed.ts` reads this. An earlier
   * attempt put `.min(12)` here and immediately proved the point: a machine
   * with the old nine-character value still in its .env could no longer start
   * the API at all, over a variable the API never touches. A rule that can
   * refuse boot must be about something the server actually needs. The length
   * requirement lives in the seed, which is the only code that consumes this
   * and the only place the answer matters.
   */
  SEED_ADMIN_PASSWORD: z.string().optional(),

  // Image uploads for the admin panel. Optional on purpose: the API must boot
  // and serve everything else on an install where storage was never set up,
  // with only the upload route reporting itself unavailable.
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_MEDIA_BUCKET: z.string().min(1).default('media'),
  /**
   * A SEPARATE, PRIVATE bucket for admission documents. No default on purpose.
   *
   * These are identity documents and marks cards belonging to applicants, many
   * of them minors. SUPABASE_MEDIA_BUCKET is public by design — event covers
   * and gallery photographs are meant to be world-readable — and defaulting
   * this to it, or falling back to it when unset, is how a scan of someone's
   * ID ends up permanently public. Unset means the upload path refuses to run.
   */
  SUPABASE_ADMISSIONS_BUCKET: z.string().min(1).optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  console.error(
    `\n[config] Invalid environment.\n${issues}\n\n` +
      `Copy backend/.env.example to backend/.env and fill it in.\n`,
  )
  process.exit(1)
}

const raw = parsed.data

if (
  raw.NODE_ENV === 'production' &&
  raw.JWT_SECRET === 'change-me-to-a-long-random-string'
) {
  console.error('[config] Refusing to start in production with the default JWT_SECRET.')
  process.exit(1)
}

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  /** Parsed allow-list of browser origins permitted to call the API. */
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}

export type Env = typeof env
