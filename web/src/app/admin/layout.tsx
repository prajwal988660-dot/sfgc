import type { Metadata } from 'next'

/**
 * The staff panel.
 *
 * Unlisted rather than secret: nothing links here, robots.ts disallows it and
 * the metadata below asks crawlers not to index or follow. None of that is the
 * protection — the API authorises every write itself and rejects a request
 * without a staff token. This only keeps the page out of search results.
 */
export const metadata: Metadata = {
  title: 'Staff panel',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-muted/30">{children}</div>
}
