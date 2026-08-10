'use client'

import * as React from 'react'
import { AlertCircle, Loader2, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { browserApi, errorMessage } from '@/lib/api'
import { isStaff, storeSession } from '@/lib/admin-session'

/**
 * Sign-in for the staff panel.
 *
 * Deliberately plain: no college branding, no "forgot password", nothing that
 * announces what this page belongs to. On success the page reloads so every
 * guarded screen re-reads the session from scratch.
 */
export function AdminLoginForm() {
  const [identifier, setIdentifier] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return

    setError(null)
    setBusy(true)
    try {
      const { token, user } = await browserApi.auth.login({
        identifier: identifier.trim(),
        password,
      })

      // A student's credentials are valid against the API but must not open
      // the editor. The API would refuse the writes anyway; refusing here
      // means they see why instead of a panel where every button fails.
      if (!isStaff(user)) {
        setError('This area is for college staff.')
        return
      }

      storeSession(token, user)
      window.location.reload()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>

          <h1 className="mt-5 font-display text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Staff access only.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or staff ID</Label>
              <Input
                id="identifier"
                name="identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={busy}
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
