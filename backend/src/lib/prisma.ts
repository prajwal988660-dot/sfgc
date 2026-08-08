import { PrismaClient } from '@prisma/client'
import { env } from '../config/env'

/**
 * A single Prisma client for the process. `globalThis` caching keeps `tsx
 * watch` from opening a new pool on every reload, which quickly exhausts
 * Supabase's connection limit.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDevelopment ? ['warn', 'error'] : ['error'],
  })

if (!env.isProduction) globalForPrisma.prisma = prisma

/** Used by the health check to report whether the database is reachable. */
export async function pingDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
