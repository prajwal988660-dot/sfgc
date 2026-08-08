import type { Response } from 'express'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** `{ success: true, data }` — the only shape a successful response takes. */
export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data })
}

export function created<T>(res: Response, data: T): Response {
  return ok(res, data, 201)
}

/** `{ success: true, data: [...], meta }` for collections. */
export function paginated<T>(
  res: Response,
  items: T[],
  meta: PaginationMeta,
): Response {
  return res.status(200).json({ success: true, data: items, meta })
}

/** Normalises `?page=&limit=` into safe values with a hard upper bound. */
export function readPagination(query: Record<string, unknown>, defaultLimit = 20) {
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1)
  const rawLimit = Number.parseInt(String(query.limit ?? defaultLimit), 10) || defaultLimit
  const limit = Math.min(100, Math.max(1, rawLimit))
  return { page, limit, skip: (page - 1) * limit }
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}
