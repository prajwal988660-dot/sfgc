/**
 * Rewrites the password in backend/.env after a database rotation.
 *
 *   NEW_DB_PASSWORD='...' node scripts/set-db-password.mjs
 *
 * The value comes through the environment rather than as an argument so it
 * stays out of shell history and out of `ps`, and so it never has to be pasted
 * into a chat or a ticket.
 *
 * Only the password changes. The host, port, username — including the
 * `postgres.<project-ref>` tenant suffix the Supabase pooler requires — and
 * every query parameter are preserved exactly, because those are the parts that
 * are easy to retype wrong and produce a failure that looks like a permissions
 * error rather than a connection one.
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, 'backend/.env')

const password = process.env.NEW_DB_PASSWORD
if (!password) {
  console.error(
    "\n  NEW_DB_PASSWORD is not set.\n\n" +
      "    NEW_DB_PASSWORD='...' node scripts/set-db-password.mjs\n",
  )
  process.exit(1)
}
if (!existsSync(envPath)) {
  console.error(`\n  No file at ${envPath}\n`)
  process.exit(1)
}

/**
 * Percent-encoding is not optional.
 *
 * These URLs are parsed as URIs, and a password containing @ : / ? # or %
 * silently truncates or misdirects the connection — `p@ss@host` parses the
 * wrong `@` as the host separator. encodeURIComponent leaves unreserved
 * characters alone, so a simple password is unchanged.
 */
const encoded = encodeURIComponent(password)

const original = readFileSync(envPath, 'utf8')
let updated = original
let changed = 0

for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
  // Captures: everything up to the password, the password, and the rest.
  const pattern = new RegExp(`^(${key}="?postgresql://[^:]+:)([^@]*)(@.*)$`, 'm')
  const match = updated.match(pattern)
  if (!match) {
    console.error(`\n  Could not find a ${key} to update in backend/.env\n`)
    process.exit(1)
  }
  updated = updated.replace(pattern, `$1${encoded}$3`)
  changed += 1
}

// A copy of the previous file, in case the rotation itself went wrong and the
// old value is needed to get back in. Gitignored by the `.env.*` rule.
copyFileSync(envPath, `${envPath}.previous`)
writeFileSync(envPath, updated)

console.log(`\n  Updated ${changed} connection string(s) in backend/.env`)
console.log(`  Previous file kept at backend/.env.previous`)
console.log('  The password is not printed here or anywhere else.\n')
