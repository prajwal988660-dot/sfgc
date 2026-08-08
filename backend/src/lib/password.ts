import bcrypt from 'bcryptjs'

/**
 * bcryptjs (pure JS) rather than bcrypt (native) — no node-gyp toolchain
 * needed, which matters on Windows dev machines and slim deploy images.
 */
const ROUNDS = 10

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
