/**
 * Sets one user's password.
 *
 *   NEW_PASSWORD='...' npm run user:password --workspace backend -- admin@sfgc.ac.in
 *
 * Exists because the seed is the wrong tool for this: it upserts dozens of demo
 * accounts and rewrites their data, when all that is wanted is one password on
 * one account. This touches a single row and nothing else.
 *
 * The password arrives through the environment rather than as an argument, so
 * it does not end up in the shell history or in the process list where any
 * other user on the machine could read it with `ps`.
 */
import { PrismaClient } from '@prisma/client'

import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

/** Long enough to resist offline cracking of a stolen bcrypt hash. */
const MIN_LENGTH = 12

/**
 * Credentials that have appeared in this repository's history, and so must be
 * assumed public regardless of who set them.
 */
const KNOWN_PUBLIC = new Set([
  'Admin@123',
  'teacher123',
  'student123',
  'change-me-to-a-long-random-string',
])

async function main() {
  const identifier = process.argv[2]
  const password = process.env.NEW_PASSWORD

  if (!identifier) {
    throw new Error(
      'Which account?\n\n' +
        "  NEW_PASSWORD='...' npm run user:password --workspace backend -- admin@sfgc.ac.in\n\n" +
        'The identifier can be an email, a register number or an employee id.',
    )
  }

  if (!password) {
    throw new Error(
      'NEW_PASSWORD is not set.\n\n' +
        'Pass it through the environment so it stays out of your shell history:\n\n' +
        "  NEW_PASSWORD='...' npm run user:password --workspace backend -- " +
        identifier,
    )
  }

  // Checked before length, so someone reaching for one of the old demo
  // passwords is told the real reason. Every one of them is under the minimum,
  // so the length check would otherwise answer first and say only "too short",
  // which invites a ninth character rather than a different password.
  if (KNOWN_PUBLIC.has(password)) {
    throw new Error(
      'That password appears in this repository and must be treated as public. Choose another.',
    )
  }

  if (password.length < MIN_LENGTH) {
    throw new Error(`That password is ${password.length} characters. Use at least ${MIN_LENGTH}.`)
  }

  // Case-insensitive across the three columns a login accepts, matching how
  // POST /auth/login resolves an identifier — so anything that can sign in can
  // also be targeted here, and nothing else can.
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: 'insensitive' } },
        { registerNo: { equals: identifier, mode: 'insensitive' } },
        { employeeId: { equals: identifier, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!user) {
    throw new Error(`No account matches "${identifier}".`)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  })

  // The password itself is never printed, here or anywhere else.
  console.log(`\n  Password updated for ${user.name} <${user.email}> [${user.role}]`)
  console.log('  Every existing session stays valid — JWTs already issued are not revoked.\n')
}

main()
  .catch((error: unknown) => {
    console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
