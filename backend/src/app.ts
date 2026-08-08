import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import { env } from './config/env'
import routes from './routes'
import { AppError } from './lib/errors'
import { errorHandler, notFoundHandler } from './middleware/error'

export function createApp() {
  const app = express()

  // Behind Render/Railway/Fly the client IP arrives in X-Forwarded-For; the
  // rate limiter needs this to key on the real caller rather than the proxy.
  app.set('trust proxy', 1)

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(compression())

  app.use(
    cors({
      origin(origin, callback) {
        // No origin: same-origin, curl, or a native mobile app — all allowed,
        // since the JWT (not the origin) is what authorises those callers.
        if (!origin) return callback(null, true)
        if (env.corsOrigins.includes(origin) || env.corsOrigins.includes('*')) {
          return callback(null, true)
        }
        // An AppError rather than a bare Error: a blocked origin is a client
        // policy decision, and a plain Error would surface as a 500 and log a
        // stack trace as though the server had failed.
        return callback(
          new AppError('FORBIDDEN', `Origin ${origin} is not allowed by CORS.`),
        )
      },
      credentials: true,
    }),
  )

  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))

  if (!env.isProduction) {
    app.use(morgan('dev'))
  } else {
    app.use(morgan('combined'))
  }

  // Broad limiter for the whole API; /auth adds a much tighter one of its own.
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: env.isProduction ? 600 : 10_000,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' },
      },
    }),
  )

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: {
        name: 'SFGC Platform API',
        version: '1.0.0',
        docs: 'See API_CONTRACT.md',
        health: '/api/health',
      },
    })
  })

  app.use('/api', routes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
