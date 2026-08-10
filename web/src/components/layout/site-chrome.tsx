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
  footer,
  children,
}: {
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const bare = pathname?.startsWith('/admin') ?? false

  return (
    <>
      {bare ? null : header}
      <main id="main">{children}</main>
      {bare ? null : footer}
    </>
  )
}
