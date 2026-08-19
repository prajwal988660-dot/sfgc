'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  Lock,
  LogOut,
  Megaphone,
  Users,
} from 'lucide-react'

import type { User } from '@sfgc/shared'
import { roleLabel } from '@sfgc/shared'
import { Button } from '@/components/ui/button'
import { useAdminSession } from '@/lib/admin-session'
import { cn } from '@/lib/utils'

import { AdminLoginForm } from './login-form'

const NAV = [
  { href: '/admin/classes', label: 'Classes', icon: GraduationCap },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/library', label: 'Library', icon: BookOpen },
  { href: '/admin/notices', label: 'Notices', icon: Megaphone },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/media', label: 'Pictures', icon: ImageIcon },
] as const

/**
 * Wraps every panel page.
 *
 * Signed out, it renders the login form in place rather than redirecting —
 * a redirect would lose which page was being opened, and the panel is small
 * enough that landing straight on the requested screen after signing in is
 * worth more than a tidy URL.
 */
export function AdminGuard({ children }: { children: (user: User) => React.ReactNode }) {
  const session = useAdminSession()

  if (session.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Checking your session…</span>
      </div>
    )
  }

  if (session.status === 'anonymous') {
    return <AdminLoginForm />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav user={session.user} onSignOut={session.signOut} />
      <main className="container flex-1 py-10">{children(session.user)}</main>
    </div>
  )
}

function AdminNav({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-card">
      <div className="container flex flex-wrap items-center gap-4 py-4">
        <Link href="/admin" className="flex items-center gap-2 font-display font-semibold">
          <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
          Staff panel
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.name} · {roleLabel(user.role)}
          </span>
          <Button variant="outline" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
