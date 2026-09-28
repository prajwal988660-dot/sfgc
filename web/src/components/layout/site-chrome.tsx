'use client'

import { usePathname } from 'next/navigation'

/**
 * Decides whether a page gets the public header and footer.
 *
 * The staff panel at /admin has its own navigation and should not carry the
 * college nav, the theme switcher or an "Apply Now" button — nor should a page
 * behind a login advertise itself with full site branding.
 *
 * Header and footer arrive as props rather than imports: the footer is a
 * Server Component, and a Client Component cannot import one. Passing them in
 * as already-rendered elements keeps both of them off the client bundle.
 */
export function SiteChrome({
  header,
  noticeBar,
  footer,
  children,
}: {
  header: React.ReactNode
  /** Latest-notices strip under the header (a Server Component, passed in). */
  noticeBar?: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const bare = pathname?.startsWith('/admin') ?? false
  // The homepage header overlays its hero, which would hide the strip; the
  // homepage carries its own notices section instead.
  const isHome = pathname === '/'

  return (
    <>
      {bare ? null : header}
      {bare || isHome ? null : noticeBar}
      <main id="main">{children}</main>
      {bare ? null : footer}
    </>
  )
}
