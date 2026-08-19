import { Router } from 'express'

import { prisma, pingDatabase } from '../lib/prisma'
import { asyncHandler } from '../lib/async'
import { ok } from '../lib/respond'
import { cachePublicStats } from '../middleware/cache'

const router = Router()

/**
 * The college's published placement figure. Editorial, not computed — the
 * platform holds no offer-letter data, so this is a number the office signs off
 * on and edits here rather than something derived from the database.
 */
export const PLACEMENT_RATE = 92

interface HealthPayload {
  status: 'ok'
  uptime: number
  db: 'up' | 'down'
}

interface StatCounts {
  students: number
  teachers: number
  events: number
  notices: number
}

interface PublicStats extends StatCounts {
  placementRate: number
}

const ZERO_COUNTS: StatCounts = { students: 0, teachers: 0, events: 0, notices: 0 }

/**
 * GET /api — public.
 *
 * Opening the API base in a browser is the first thing anyone does, and a bare
 * 404 there reads as "the server is broken" when it is running fine. This lists
 * what actually exists instead.
 */
router.get('/', (_req, res) => {
  ok(res, {
    name: 'SFGC Platform API',
    version: '1.0.0',
    message:
      'This is a JSON API, not a website. The public site runs separately on http://localhost:3000',
    docs: 'API_CONTRACT.md in the repository root',
    publicEndpoints: {
      health: '/api/health',
      stats: '/api/stats/public',
      events: '/api/events',
      notices: '/api/notices',
    },
    authentication: {
      login: 'POST /api/auth/login  { identifier, password }',
      then: 'send the returned token as: Authorization: Bearer <token>',
    },
  })
})

/**
 * GET /health — public.
 *
 * Always answers 200 with `success: true`; a failed database ping is reported as
 * `db: 'down'` in the payload instead of an error status, so an uptime monitor
 * can tell "the process is dead" apart from "the process is alive but Postgres
 * is unreachable".
 */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const reachable = await pingDatabase()
    const payload: HealthPayload = {
      status: 'ok',
      uptime: process.uptime(),
      db: reachable ? 'up' : 'down',
    }
    return ok(res, payload)
  }),
)

/**
 * The homepage must render even when the database is unreachable, so an outage
 * degrades to zeroed counters rather than a 500 that blanks the stats section.
 */
async function countPublicStats(): Promise<StatCounts> {
  const now = new Date()
  try {
    const [students, teachers, events, notices] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
      prisma.event.count({ where: { isPublished: true } }),
      prisma.notice.count({
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      }),
    ])
    return { students, teachers, events, notices }
  } catch {
    return { ...ZERO_COUNTS }
  }
}

/**
 * GET /stats/public — public.
 *
 * Feeds the animated counters on the website homepage. Only active accounts,
 * published events and unexpired notices are counted, so the public figures
 * match what a visitor can actually see on the site.
 */
router.get(
  '/stats/public',
  cachePublicStats,
  asyncHandler(async (_req, res) => {
    const counts = await countPublicStats()
    const payload: PublicStats = { ...counts, placementRate: PLACEMENT_RATE }
    return ok(res, payload)
  }),
)

export default router
