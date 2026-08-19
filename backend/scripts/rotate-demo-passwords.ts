/**
 * Gives every account still using a published demo password a unique random one.
 *
 *   npm run db:rotate-demo --workspace backend
 *
 * WHY THIS EXISTS
 *   prisma/seed.ts creates its teachers and students with the constants
 *   `teacher123` and `student123`, which are committed to this repository.
 *   They are fine while the only data is invented. The moment a real student's
 *   attendance or marks are in the database, they mean anyone who has read the
 *   repo can sign in as any of those accounts.
 *
 *   Run this before real people use the system. It is deliberately a separate
 *   command rather than something the seed does, because rotating passwords
 *   also locks whoever is testing out of the demo logins — that has to be a
 *   decision, not a surprise.
 *
 * WHAT IT DOES
 *   Only touches accounts whose password still verifies against one of the
 *   known published values. An account someone has already changed is left
 *   alone. The new passwords are written to a CSV outside the repository so
 *   they can be handed out, and printed nowhere.
 */
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

/** Every password this repository has published. */
const PUBLISHED = ['teacher123', 'student123', 'Admin@123']

/**
 * Readable and unambiguous when written on paper.
 *
 * No 0/O or 1/l/I, because these get printed on a slip and typed on a phone by
 * someone who has never seen them before. Alphanumeric only, so nothing needs
 * percent-encoding if it ever reaches a URL.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

function readablePassword(length = 12): string {
  let out = ''
  while (out.length < length) {
    const byte = randomBytes(1)[0] as number
    // Rejection sampling: taking a modulo of 256 would favour the first few
    // characters of the alphabet.
    if (byte < 256 - (256 % ALPHABET.length)) out += ALPHABET[byte % ALPHABET.length]
  }
  return out
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, registerNo: true, studentCode: true, employeeId: true, passwordHash: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  const rows: string[] = ['identifier,name,role,new_password']
  let rotated = 0
  let skipped = 0

  for (const user of users) {
    const usesPublished = PUBLISHED.some((candidate) =>
      bcrypt.compareSync(candidate, user.passwordHash),
    )
    if (!usesPublished) {
      skipped += 1
      continue
    }

    const password = readablePassword()
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    })

    // The identifier the person actually signs in with, not the internal id.
    const identifier = user.studentCode ?? user.employeeId ?? user.registerNo ?? user.email
    rows.push(`${identifier},"${user.name}",${user.role},${password}`)
    rotated += 1
  }

  if (rotated === 0) {
    console.log('\n  Nothing to do — no account is using a published password.\n')
    return
  }

  // Outside the repository, so it cannot be committed by accident. The CSV is
  // the only copy of these passwords; nothing is printed to the terminal.
  const out = resolve(process.cwd(), '..', 'sfgc-new-passwords.csv')
  writeFileSync(out, rows.join('\n') + '\n', { mode: 0o600 })

  console.log(`\n  Rotated ${rotated} account(s). ${skipped} already had their own password.`)
  console.log(`  New passwords written to: ${out}`)
  console.log('  Hand them out, then DELETE that file. It is the only copy.')
  console.log('  Nothing was printed here on purpose.\n')
}

main()
  .catch((error: unknown) => {
    console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
