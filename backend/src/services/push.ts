import { Expo } from 'expo-server-sdk'
import { Prisma, type NoticeAudience, type Role } from '@prisma/client'
import { prisma } from '../lib/prisma'

/** How much of the notice body rides along in the notification. */
const EXCERPT_LENGTH = 140

const FALLBACK_BODY = 'Tap to read the full notice.'

export interface PushSummary {
  sent: number
  failed: number
}

/** The slice of a notice the push service needs; a full Notice row satisfies it. */
export interface NoticePushPayload {
  id: string
  title: string
  body: string
  audience: NoticeAudience
  program: string | null
  semester: number | null
}

let client: InstanceType<typeof Expo> | null = null

/**
 * Created lazily so importing this module never touches the network, and
 * reused so the SDK's internal rate limiter actually spans all our sends.
 * EXPO_ACCESS_TOKEN is optional — it is only needed once push security is
 * enabled on the Expo project.
 */
function getExpo(): InstanceType<typeof Expo> {
  if (!client) {
    client = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN })
  }
  return client
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  nbsp: ' ',
}

/** Notice bodies may contain markup from the admin editor; a push cannot. */
export function stripHtml(input: string): string {
  return input
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#?\w+);/g, (match, entity: string) => HTML_ENTITIES[entity.toLowerCase()] ?? match)
    .replace(/\s+/g, ' ')
    .trim()
}

/** Plain-text preview of at most `max` characters, cut on a word boundary. */
export function excerpt(input: string, max: number = EXCERPT_LENGTH): string {
  const text = stripHtml(input)
  if (text.length <= max) return text
  const slice = text.slice(0, max - 1)
  const lastSpace = slice.lastIndexOf(' ')
  const head = lastSpace > Math.floor(max / 2) ? slice.slice(0, lastSpace) : slice
  return `${head.trimEnd()}…`
}

/**
 * Roles that receive a notice addressed to staff.
 *
 * Named once rather than written inline, because inline is exactly what broke:
 * this file said `role: 'ADMIN'` and went on saying it after the
 * administrator's row moved to SUPER_ADMIN. The match silently became zero
 * users, and the college's administrator stopped receiving every push
 * notification. Nothing errored; the notices simply stopped arriving, which is
 * the hardest kind of failure to notice.
 *
 * ADMIN stays only until the deprecated value leaves the enum.
 */
const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN']

/**
 * Who should be woken up for this notice. Mirrors the visibility rules of
 * `GET /notices`: admins see everything, teachers see ALL/TEACHERS, students
 * see ALL/STUDENTS narrowed by the notice's program and semester when set.
 */
function recipientWhere(notice: NoticePushPayload): Prisma.UserWhereInput {
  const narrowing: Prisma.UserWhereInput[] = []
  if (notice.program !== null) narrowing.push({ program: notice.program })
  if (notice.semester !== null) narrowing.push({ semester: notice.semester })

  const students: Prisma.UserWhereInput =
    narrowing.length > 0 ? { role: 'STUDENT', AND: narrowing } : { role: 'STUDENT' }

  let audience: Prisma.UserWhereInput
  switch (notice.audience) {
    case 'STUDENTS':
      // Administrators too, so they see what was sent to students.
      audience = { OR: [{ role: { in: ADMIN_ROLES } }, students] }
      break
    case 'TEACHERS':
      audience = { role: { in: [...ADMIN_ROLES, 'TEACHER'] } }
      break
    default:
      // ALL means all. Listing roles here is what broke it before: every role
      // added later is silently excluded from a notice addressed to everyone.
      audience = {}
  }

  return {
    isActive: true,
    expoPushToken: { not: null },
    AND: [audience],
  }
}

/**
 * Fires an Expo push for a freshly published notice. Never throws: a dead
 * push provider must not turn a successful `POST /notices` into a 500, so
 * every failure is logged and folded into the returned summary instead.
 */
export async function notifyNotice(notice: NoticePushPayload): Promise<PushSummary> {
  let sent = 0
  let failed = 0

  try {
    const recipients = await prisma.user.findMany({
      where: recipientWhere(notice),
      select: { expoPushToken: true },
    })
    if (recipients.length === 0) return { sent: 0, failed: 0 }

    // Two accounts on one device share a token; sending twice would double-buzz.
    const tokens = new Set<string>()
    let malformed = 0
    for (const recipient of recipients) {
      const token = recipient.expoPushToken
      if (!token) continue
      if (!Expo.isExpoPushToken(token)) {
        malformed += 1
        continue
      }
      tokens.add(token)
    }
    if (malformed > 0) {
      failed += malformed
      console.error(`[push] ${malformed} stored token(s) are not valid Expo push tokens`)
    }
    if (tokens.size === 0) return { sent, failed }

    const preview = excerpt(notice.body)
    const messages = [...tokens].map((to) => ({
      to,
      sound: 'default' as const,
      title: notice.title,
      body: preview.length > 0 ? preview : FALLBACK_BODY,
      data: { type: 'notice', noticeId: notice.id },
    }))

    const expo = getExpo()
    // Sequential on purpose: the SDK throttles per call, and firing every
    // chunk at once is what trips Expo's rate limiter on a large college roll.
    for (const chunk of expo.chunkPushNotifications(messages)) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk)
        for (const ticket of tickets) {
          if (ticket.status === 'ok') {
            sent += 1
          } else {
            failed += 1
            console.error('[push] Expo rejected a notification', ticket)
          }
        }
      } catch (error) {
        failed += chunk.length
        console.error('[push] chunk delivery failed', error)
      }
    }
  } catch (error) {
    console.error(`[push] notifyNotice failed for notice ${notice.id}`, error)
  }

  return { sent, failed }
}
