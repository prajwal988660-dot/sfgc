import { createApp } from './app'
import { env } from './config/env'
import { prisma, pingDatabase } from './lib/prisma'

async function main() {
  const app = createApp()

  const dbUp = await pingDatabase()
  if (!dbUp) {
    console.warn(
      '\n[startup] Could not reach the database.\n' +
        '          The API will start, but every data route will fail.\n' +
        '          Check DATABASE_URL in backend/.env, then run:\n' +
        '            npm run db:push --workspace backend\n',
    )
  }

  const server = app.listen(env.PORT, () => {
    console.log(
      `\n  SFGC API ready\n` +
        `  ➜  http://localhost:${env.PORT}/api\n` +
        `  ➜  health  http://localhost:${env.PORT}/api/health\n` +
        `  ➜  env     ${env.NODE_ENV}\n` +
        `  ➜  db      ${dbUp ? 'connected' : 'UNREACHABLE'}\n`,
    )
  })

  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] shutting down…`)
    server.close(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
    // Don't let a hung connection block the exit forever.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

main().catch((err) => {
  console.error('[startup] Failed to start the server:', err)
  process.exit(1)
})
