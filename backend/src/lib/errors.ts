/**
 * The API's error vocabulary. Every failure thrown anywhere in the app should
 * be one of these so the error middleware can map it to the documented
 * envelope without guessing.
 */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export interface ApiErrorDetail {
  path: string
  message: string
}

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
}

export class AppError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details?: ApiErrorDetail[]

  constructor(code: ApiErrorCode, message: string, details?: ApiErrorDetail[]) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = STATUS_BY_CODE[code]
    this.details = details
    Error.captureStackTrace?.(this, AppError)
  }
}

export const badRequest = (message: string, details?: ApiErrorDetail[]) =>
  new AppError('VALIDATION_ERROR', message, details)

export const unauthenticated = (message = 'Authentication required.') =>
  new AppError('UNAUTHENTICATED', message)

export const invalidCredentials = (message = 'Incorrect login or password.') =>
  new AppError('INVALID_CREDENTIALS', message)

export const forbidden = (message = 'You do not have permission to do that.') =>
  new AppError('FORBIDDEN', message)

export const notFound = (what = 'Resource') =>
  new AppError('NOT_FOUND', `${what} not found.`)

export const conflict = (message: string) => new AppError('CONFLICT', message)
