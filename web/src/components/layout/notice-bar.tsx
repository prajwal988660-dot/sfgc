import Link from 'next/link'
import { ArrowRight, Megaphone } from 'lucide-react'

import type { Notice, Paginated } from '@sfgc/shared'
import { api, safeFetch } from '@/lib/api'

const EMPTY_PAGE: Paginated<Notice> = {
  items: [],
  meta: { page: 1, limit: 3, total: 0, totalPages: 1 },
}

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })

/**
 * "Latest" strip under the site header: the three newest notices, still, with
 * a link to the notice board. Server component, so it costs no client JS; the
 * fetch is time-cached like the notices page. Renders nothing when there are
 * no notices or the API is unreachable.
 */
export async function NoticeBar() {
  const { items } = await safeFetch<Paginated<Notice>>(
    () => api.notices.list({ limit: 3 }, { revalidate: 60 }),
    EMPTY_PAGE,
    'notices.list (notice bar)',
  )

  if (items.length === 0) return null

  return (
    <aside aria-label="Latest notices" className="border-b border-border bg-secondary/70">
      <div className="container flex items-center gap-4 py-2 text-sm">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-maroon-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-white">
          <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
          Latest
        </span>

        <ul className="flex min-w-0 flex-1 items-center gap-6 overflow-hidden">
          {items.map((notice, index) => (
            <li
              key={notice.id}
              // One notice on phones, all three from lg up.
              className={index === 0 ? 'min-w-0 truncate' : 'hidden min-w-0 truncate lg:block'}
            >
              <Link
                href="/notices"
                className="font-medium text-primary-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-white"
              >
                {notice.title}
              </Link>
              <span className="ml-2 text-xs text-muted-foreground">
                {DATE.format(new Date(notice.publishedAt))}
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/notices"
          className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex dark:text-primary-200"
        >
          All notices
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  )
}
