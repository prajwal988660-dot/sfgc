import { ApiClient, ApiError } from '@sfgc/shared'
import { getToken } from './storage'

/**
 * The API base URL comes from EXPO_PUBLIC_API_URL, which Expo inlines at build
 * time. A phone cannot reach "localhost" — that address is the phone itself —
 * so during development this must be the dev machine's LAN IP.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.5:4000/api'

if (__DEV__ && /localhost|127\.0\.0\.1/.test(API_URL)) {
  console.warn(
    `[api] EXPO_PUBLIC_API_URL is "${API_URL}". A physical device cannot reach ` +
      `localhost — set it to your computer's LAN IP (e.g. http://192.168.1.5:4000/api) ` +
      `in apps/student-app/.env and restart with "npx expo start -c".`,
  )
}

/** Set by the auth store so a 401 anywhere can trigger a sign-out. */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export const api = new ApiClient({
  baseUrl: API_URL,
  getToken,
  onUnauthorized: () => onUnauthorized?.(),
  // 60s, not 20s. The API is hosted on a free tier that sleeps after a spell
  // of inactivity, and waking it up has been measured at ~38 seconds. A 20s
  // timeout gave up before the server had finished booting, so the first
  // request after a quiet period failed every time.
  timeoutMs: 60_000,
})

export { ApiError }
export const apiBaseUrl = API_URL

/** Turns any thrown value into a sentence worth showing a student. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') {
      return `Cannot reach the college server. Check your connection.`
    }
    if (error.details?.length) {
      return error.details.map((detail) => detail.message).join('\n')
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
