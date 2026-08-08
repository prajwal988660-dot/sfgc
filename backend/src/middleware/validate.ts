import type { RequestHandler } from 'express'
import type { ZodTypeAny, z } from 'zod'

/**
 * Validates and *replaces* the request body with the parsed result, so
 * handlers receive coerced, trimmed, fully typed values rather than raw JSON.
 */
export function validateBody<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      next(result.error)
      return
    }
    req.body = result.data
    next()
  }
}

/**
 * Validates query params. Express 5 makes `req.query` a getter, so the parsed
 * value is stashed on `res.locals.query` as well as assigned where possible.
 */
export function validateQuery<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      next(result.error)
      return
    }
    res.locals.query = result.data
    try {
      req.query = result.data as typeof req.query
    } catch {
      // Express 5: req.query is read-only — res.locals.query is the fallback.
    }
    next()
  }
}

/** Reads the value stored by `validateQuery`. */
export function parsedQuery<T extends ZodTypeAny>(
  res: { locals: Record<string, unknown> },
): z.infer<T> {
  return res.locals.query as z.infer<T>
}
