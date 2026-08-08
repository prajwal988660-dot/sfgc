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
import { registerForPushNotifications } from '@/lib/notifications'

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

  // Restore the session on launch: show the cached user immediately so the app
  // does not flash the login screen, then confirm it against the server.
  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      const cached = await readJson<User>(StorageKeys.USER)
      if (!cancelled && cached) setUser(cached)

      try {
        const fresh = await api.auth.me()
        if (cancelled) return
        if (fresh.role !== 'STUDENT') {
          await clearSession()
          setUser(null)
        } else {
          setUser(fresh)
          await writeJson(StorageKeys.USER, fresh)
          void registerForPushNotifications()
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

      // Staff credentials are valid against the API but belong in the Teacher app.
      if (signedIn.role !== 'STUDENT') {
        setError('This app is for students. Staff should use the SFGC Teacher app.')
        return false
      }

      await setToken(token)
      await writeJson(StorageKeys.USER, signedIn)
      setUser(signedIn)

      // Registering the push token needs the session, so it happens after the
      // token is stored — and must never block or fail the sign-in.
      void registerForPushNotifications()
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
