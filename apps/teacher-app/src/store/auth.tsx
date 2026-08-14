import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { User } from '@sfgc/shared'

import { api, errorMessage, setUnauthorizedHandler } from '@/lib/api'
import { clearSession, readJson, setToken, StorageKeys, writeJson } from '@/lib/storage'

interface AuthState {
  user: User | null
  /** True until the stored session has been read from disk on launch. */
  initialising: boolean
  signingIn: boolean
  error: string | null
  signIn: (identifier: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initialising, setInitialising] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signOut = useCallback(async () => {
    setUser(null)
    setError(null)
    await clearSession()
  }, [])

  // A 401 from any request means the token is dead — drop the session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut()
    })
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  // Restore the session on launch.
  //
  // A cached user ends the loading state straight away, and the server check
  // then runs in the background. Waiting for that request before showing
  // anything meant the app sat on a spinner for as long as the API took to
  // answer — and on a free-tier host that has gone to sleep, waking up takes
  // longer than the request timeout, so the app reliably gave up and dropped
  // the student back at the login screen.
  //
  // Only a launch with no cached user still waits, because until the server
  // answers there is genuinely nothing to show.
  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      const cached = await readJson<User>(StorageKeys.USER)
      if (!cancelled && cached) {
        setUser(cached)
        setInitialising(false)
      }

      try {
        const fresh = await api.auth.me()
        if (cancelled) return
        if (fresh.role !== 'TEACHER' && fresh.role !== 'ADMIN') {
          await clearSession()
          setUser(null)
        } else {
          setUser(fresh)
          await writeJson(StorageKeys.USER, fresh)
        }
      } catch {
        // No token, expired token, or the server is unreachable. If we have no
        // cached user there is nothing to show, so land on the login screen.
        if (!cancelled && !cached) setUser(null)
      } finally {
        if (!cancelled) setInitialising(false)
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (identifier: string, password: string) => {
    setSigningIn(true)
    setError(null)
    try {
      const { token, user: signedIn } = await api.auth.login({
        identifier: identifier.trim(),
        password,
      })

      // This app is for staff only. A student's credentials are valid against
      // the API but must not open the attendance tools.
      if (signedIn.role !== 'TEACHER' && signedIn.role !== 'ADMIN') {
        setError('This app is for teaching staff. Please use the SFGC Student app.')
        return false
      }

      await setToken(token)
      await writeJson(StorageKeys.USER, signedIn)
      setUser(signedIn)
      return true
    } catch (err) {
      setError(errorMessage(err))
      return false
    } finally {
      setSigningIn(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const fresh = await api.auth.me()
      setUser(fresh)
      await writeJson(StorageKeys.USER, fresh)
    } catch {
      // Leave the cached user in place; the next 401 will sign them out.
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthState>(
    () => ({ user, initialising, signingIn, error, signIn, signOut, refresh, clearError }),
    [user, initialising, signingIn, error, signIn, signOut, refresh, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>')
  return context
}
