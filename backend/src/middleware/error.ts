import type { ErrorRequestHandler, RequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { AppError, type ApiErrorCode, type ApiErrorDetail } from '../lib/errors'
import { env } from '../config/env'

/** Terminal 404 handler — mounted after every route. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `No route matches ${req.method} ${req.originalUrl}`,
    },
  })
}

/** Human-readable messages for the Prisma errors that reach users. */
function fromPrisma(
  err: Prisma.PrismaClientKnownRequestError,
): { code: ApiErrorCode; message: string; details?: ApiErrorDetail[] } {
  switch (err.code) {
    case 'P2002': {
      const target = err.meta?.target
      const fields = Array.isArray(target) ? target.map(String) : [String(target ?? 'field')]
      return {
        code: 'CONFLICT',
        message: `A record with this ${fields.join(', ')} already exists.`,
        details: fields.map((path) => ({ path, message: 'Already taken.' })),
      }
    }
    case 'P2025':
      return { code: 'NOT_FOUND', message: 'The requested record does not exist.' }
    case 'P2003':
      return {
        code: 'VALIDATION_ERROR',
        message: 'Referenced record does not exist.',
      }
    case 'P2014':
      return {
        code: 'CONFLICT',
        message: 'This record is still referenced by other records.',
      }
    default:
      return { code: 'INTERNAL_ERROR', message: 'Database request failed.' }
  }
}

/**
 * The single place an error becomes JSON. Everything thrown in the app lands
 * here and leaves in the documented `{ success: false, error }` envelope.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let code: ApiErrorCode = 'INTERNAL_ERROR'
  let status = 500
  let message = 'Something went wrong on our end.'
  let details: ApiErrorDetail[] | undefined

  if (err instanceof AppError) {
    code = err.code
    status = err.status
    message = err.message
    details = err.details
  } else if (err instanceof ZodError) {
    code = 'VALIDATION_ERROR'
    status = 400
    message = 'Some fields need attention.'
    details = err.issues.map((issue) => ({
      path: issue.path.join('.') || 'body',
      message: issue.message,
    }))
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = fromPrisma(err)
    code = mapped.code
    message = mapped.message
    details = mapped.details
    status = code === 'CONFLICT' ? 409 : code === 'NOT_FOUND' ? 404 : code === 'VALIDATION_ERROR' ? 400 : 500
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    code = 'VALIDATION_ERROR'
    status = 400
    message = 'The request did not match what the database expects.'
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    code = 'INTERNAL_ERROR'
    status = 500
    message =
      'Cannot reach the database. Check DATABASE_URL and that the database is running.'
  } else if (err instanceof SyntaxError && 'body' in err) {
    code = 'VALIDATION_ERROR'
    status = 400
    message = 'Request body is not valid JSON.'
  }

  // 5xx means we did something wrong — always log it with the stack.
  if (status >= 500) {
    console.error('[error]', err)
  } else if (env.isDevelopment) {
    console.warn(`[${code}] ${message}`)
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details?.length ? { details } : {}),
      ...(env.isDevelopment && status >= 500 && err instanceof Error
        ? { stack: err.stack }
        : {}),
    },
  })
}
