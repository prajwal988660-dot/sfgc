import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Express 4 does not forward rejected promises to the error middleware, so
 * every async handler is wrapped in this. Without it a thrown `AppError`
 * inside an async route hangs the request instead of returning JSON.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}
