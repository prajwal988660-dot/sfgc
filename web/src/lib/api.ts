import { ApiClient, ApiError } from '@sfgc/shared'

/**
 * Two clients, because the browser and the server reach the API differently.
 *
 * `api`       — for React Server Components and route handlers. Uses API_URL
 *               (which can point at an internal address in production).
 * `browserApi` — for client components. Uses NEXT_PUBLIC_API_URL and attaches
 *               the token the visitor's session stored.
 */

const SERVER_BASE =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

const BROWSER_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

export const TOKEN_STORAGE_KEY = 'sfgc.token'

/** Server-side client. No token: the public site reads only public data. */
export const api = new ApiClient({ baseUrl: SERVER_BASE })

/** Browser client. Reads the JWT from localStorage when one is present. */
export const browserApi = new ApiClient({
  baseUrl: BROWSER_BASE,
  getToken: () => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(TOKEN_STORAGE_KEY)
  },
  onUnauthorized: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  },
})

export { ApiError }

/**
 * Wraps a server-side fetch so a cold or missing backend renders an empty
 * section instead of crashing the whole page. The public site must stay up
 * even when the API is down.
 */
export async function safeFetch<T>(
  loader: () => Promise<T>,
  fallback: T,
  label = 'request',
): Promise<T> {
  try {
    return await loader()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[api] ${label} failed — rendering fallback. ${message}`)
    return fallback
  }
}

/** Turns an ApiError into a message worth showing a visitor. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.details?.length) {
      return error.details.map((detail) => detail.message).join(' ')
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
