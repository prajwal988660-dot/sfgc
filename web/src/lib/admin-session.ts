'use client'

import * as React from 'react'

import type { User } from '@sfgc/shared'
import { browserApi, TOKEN_STORAGE_KEY } from '@/lib/api'

/**
 * Session handling for the staff panel at /admin.
 *
 * The token lives in localStorage, matching the key `browserApi` already reads
 * so every API call from the panel is authenticated without extra plumbing.
 *
 * This is a client-side session by design: the public site is statically
 * rendered and has no server session store, and the panel is a thin editor
 * over an API that authorises every request itself. Nothing here is a security
 * boundary — the API is. A forged localStorage entry gets you a broken-looking
 * page and 401s from every endpoint behind it.
 */

const USER_STORAGE_KEY = 'sfgc.admin.user'

/** Roles the API will accept for the write endpoints the panel calls. */
const STAFF_ROLES: readonly User['role'][] = ['ADMIN', 'TEACHER']

export function isStaff(user: User | null): boolean {
  return Boolean(user && STAFF_ROLES.includes(user.role))
}

export function readStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function storeSession(token: string, user: User): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
}

export function hasToken(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(window.localStorage.getItem(TOKEN_STORAGE_KEY))
}

export type SessionState =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: User }
  | { status: 'anonymous'; user: null }

/**
 * Resolves who is signed in.
 *
 * Renders instantly from the cached user so the panel does not flash a spinner
 * on every navigation, then confirms against the API. A token that has expired
 * or been revoked fails that check and the session is cleared — the cached copy
 * is a display convenience, never the thing trusted.
 */
export function useAdminSession(): SessionState & { signOut: () => void } {
  // Always 'loading' for the first render. Seeding this from localStorage
  // would make the server (which has none, so: anonymous) and the client
  // (signed in, so: loading) disagree, and React reports that as a hydration
  // failure and throws the first paint away.
  const [state, setState] = React.useState<SessionState>({ status: 'loading', user: null })

  React.useEffect(() => {
    let cancelled = false

    if (!hasToken()) {
      setState({ status: 'anonymous', user: null })
      return
    }

    const cached = readStoredUser()
    if (cached && isStaff(cached)) {
      setState({ status: 'authenticated', user: cached })
    }

    void (async () => {
      try {
        const fresh = await browserApi.auth.me()
        if (cancelled) return
        if (!isStaff(fresh)) {
          clearSession()
          setState({ status: 'anonymous', user: null })
          return
        }
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fresh))
        setState({ status: 'authenticated', user: fresh })
      } catch {
        if (cancelled) return
        clearSession()
        setState({ status: 'anonymous', user: null })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const signOut = React.useCallback(() => {
    clearSession()
    setState({ status: 'anonymous', user: null })
  }, [])

  return { ...state, signOut }
}
