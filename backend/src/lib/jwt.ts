import jwt, { type SignOptions } from 'jsonwebtoken'
import type { Role } from '@prisma/client'
import { env } from '../config/env'
import { unauthenticated } from './errors'

export interface TokenPayload {
  sub: string
  role: Role
  email: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: 'HS256',
  } as SignOptions)
}

/** Throws `UNAUTHENTICATED` for anything that is not a valid, unexpired token. */
export function verifyToken(token: string): TokenPayload {
  try {
    // The algorithm is pinned: without it, a token is accepted for any
    // algorithm the library supports, which is how `alg` confusion attacks
    // turn a verification key into a signing key.
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
    if (typeof decoded === 'string' || !decoded.sub) {
      throw unauthenticated('Malformed token.')
    }
    return {
      sub: String(decoded.sub),
      role: (decoded as jwt.JwtPayload).role as Role,
      email: (decoded as jwt.JwtPayload).email as string,
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw unauthenticated('Your session has expired. Please sign in again.')
    }
    throw unauthenticated('Invalid authentication token.')
  }
}

/** Pulls the bearer token out of an Authorization header, if present. */
export function extractBearer(header: string | undefined): string | null {
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (!token || scheme?.toLowerCase() !== 'bearer') return null
  return token.trim() || null
}
