import fs from 'node:fs'
import path from 'node:path'

import {
  PackageCheck,
  ClipboardCheck,
  Download,
  GraduationCap,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'

import { APP_DOWNLOADS } from '@/content/college'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  ClipboardCheck,
}

interface BuildInfo {
  exists: boolean
  /** Human-readable size, e.g. "42.7 MB". */
  size: string | null
  /** Date the file was last written, e.g. "10 Aug 2026". */
  updated: string | null
}

/**
 * Reads the APK straight off disk at render time.
 *
 * This is a Server Component, so publishing a new build is just dropping the
 * file into web/public/downloads — no config to edit, no link that silently
 * 404s because a build has not happened yet.
 */
function readBuild(publicPath: string): BuildInfo {
  try {
    const filePath = path.join(process.cwd(), 'public', publicPath)
    const stat = fs.statSync(filePath)
    if (!stat.isFile() || stat.size === 0) {
      return { exists: false, size: null, updated: null }
    }
    return {
      exists: true,
      size: `${(stat.size / 1024 / 1024).toFixed(1)} MB`,
      updated: stat.mtime.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    }
  } catch {
    return { exists: false, size: null, updated: null }
  }
}

export function AppDownloadSection() {
  const apps = APP_DOWNLOADS.map((app) => ({ ...app, build: readBuild(app.file) }))
  const anyAvailable = apps.some((app) => app.build.exists)

  return (
    <section id="apps" className="section scroll-mt-28">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
            Mobile apps
          </span>
          <h2 className="heading-lg mt-5">Take the college with you</h2>
          <p className="lede mt-4">
            Two free Android apps, built for {"SFGC"}. Attendance, marks, events and
            official notices — no more relying on a group chat.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 lg:grid-cols-2">
          {apps.map((app) => {
            const Icon = ICONS[app.icon] ?? GraduationCap
            const isMaroon = app.accent === 'maroon'

            return (
              <RevealItem key={app.key}>
                <article
                  className={cn(
                    'group relative flex h-full flex-col overflow-hidden rounded-2xl border',
                    'bg-card p-7 shadow-card transition-shadow hover:shadow-lift sm:p-9',
                    isMaroon ? 'border-maroon/20' : 'border-primary/20',
                  )}
                >
                  {/* Tinted wash so the two apps are distinguishable at a glance. */}
                  <div
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl',
                      isMaroon ? 'bg-maroon/10' : 'bg-primary/10',
                    )}
                  />

                  <div className="relative flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white',
                        isMaroon ? 'bg-maroon' : 'bg-primary',
                      )}
                    >
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl font-semibold leading-tight">
                        {app.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">
                        {app.audience}
                      </p>
                    </div>
                  </div>

                  <p className="relative mt-5 leading-relaxed text-muted-foreground">
                    {app.blurb}
                  </p>

                  <ul className="relative mt-6 space-y-2.5">
                    {app.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <ShieldCheck
                          className={cn(
                            'mt-0.5 h-4 w-4 shrink-0',
                            isMaroon ? 'text-maroon' : 'text-primary',
                          )}
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="relative mt-auto pt-7">
                    {app.build.exists ? (
                      <>
                        <Button
                          asChild
                          size="lg"
                          variant={isMaroon ? 'maroon' : 'default'}
                          className="w-full"
                        >
                          {/* `download` makes the browser save the file rather
                              than try to navigate to it. */}
                          <a href={app.file} download>
                            <Download className="h-4 w-4" aria-hidden="true" />
                            Download APK
                          </a>
                        </Button>
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                          Android · {app.build.size} · updated {app.build.updated}
                        </p>
                      </>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full"
                          disabled
                          aria-disabled="true"
                        >
                          Coming soon
                        </Button>
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                          This build is not published yet — check back shortly.
                        </p>
                      </>
                    )}
                  </div>
                </article>
              </RevealItem>
            )
          })}
        </RevealGroup>

        {anyAvailable ? (
          <Reveal className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border bg-muted/50 p-6 sm:p-8">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
              <PackageCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              How to install
            </h3>
            <ol className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {[
                'Tap Download APK on your Android phone.',
                'Android will warn about installing outside the Play Store — choose Allow for your browser.',
                'Open the downloaded file and tap Install, then sign in with your college ID.',
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full
                               bg-primary text-xs font-bold text-primary-foreground"
                  >
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">Android only</Badge>
              <span>
                An iPhone version is not available. These apps are distributed by the
                college, not through the Play Store.
              </span>
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
