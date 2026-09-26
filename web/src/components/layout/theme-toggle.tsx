'use client'

import * as React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'
// The storage key and the pre-paint script live in a module with no
// 'use client', because the root layout is a Server Component and cannot read a
// plain value out of a client module.
import { DEFAULT_THEME, THEME_STORAGE_KEY, type ThemePreference } from '@/lib/theme'

function apply(preference: ThemePreference) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = preference === 'dark' || (preference === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
}

const OPTIONS: Array<{ value: ThemePreference; label: string; Icon: typeof Sun }> = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
]

export function ThemeToggle({
  className,
  tone = 'default',
}: {
  className?: string
  /** `inverse` for placement on the navy utility bar. */
  tone?: 'default' | 'inverse'
}) {
  const [preference, setPreference] = React.useState<ThemePreference>(DEFAULT_THEME)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setPreference(stored)
    }
    setMounted(true)
  }, [])

  // Follow the OS while the preference is "system".
  React.useEffect(() => {
    if (!mounted) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (preference === 'system') apply('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mounted, preference])

  const choose = (value: ThemePreference) => {
    setPreference(value)
    window.localStorage.setItem(THEME_STORAGE_KEY, value)
    apply(value)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border p-0.5',
        tone === 'inverse' ? 'border-white/15 bg-white/5' : 'border-border/60 bg-background/60',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        // Before mount we cannot know the stored value, so nothing is marked
        // active — this avoids a hydration mismatch on the aria state.
        const active = mounted && preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => choose(value)}
            className={cn(
              'inline-flex h-6 w-6 items-center justify-center rounded-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tone === 'inverse'
                ? active
                  ? 'bg-white text-primary-950'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                : active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
