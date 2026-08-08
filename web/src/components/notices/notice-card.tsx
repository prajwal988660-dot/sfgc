import { CalendarDays, Clock, Paperclip, Pin, UserRound } from 'lucide-react'

import { formatDate, relativeTime } from '@sfgc/shared'
import type { Notice } from '@sfgc/shared'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type CategoryVariant = 'maroon' | 'gold' | 'secondary' | 'success' | 'outline'

/**
 * Fixed category → colour map, so "Exam" is the same red everywhere on the
 * site without the backend having to store a colour. Keys are lowercase and
 * the lookup normalises, so a feed that sends "exam" lands in the same bucket
 * as "Exam"; anything unrecognised stays neutral rather than borrowing a
 * meaning it has not earned.
 */
const CATEGORY_VARIANT: Record<string, CategoryVariant> = {
  exam: 'maroon',
  event: 'gold',
  holiday: 'secondary',
  placement: 'success',
  general: 'outline',
}

function variantFor(category: string): CategoryVariant {
  return CATEGORY_VARIANT[category.trim().toLowerCase()] ?? 'outline'
}

/**
 * Notice bodies are typed as plain text and often carry hard line breaks. The
 * excerpt is clamped to two lines, so collapsing whitespace first is what
 * makes those two lines two lines of prose rather than two stray fragments.
 */
function excerpt(body: string): string {
  return body.replace(/\s+/g, ' ').trim()
}

export function NoticeCard({ notice }: { notice: Notice }) {
  const titleId = `notice-${notice.id}`
  const summary = excerpt(notice.body)

  // Only set on notices narrowed to a programme or semester; worth showing so
  // a reader can tell at a glance that a notice is not addressed to them.
  const targeting = [
    notice.program,
    notice.semester === null ? null : `Semester ${notice.semester}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        // The transparent rule on unpinned rows keeps every title on the same
        // optical left edge, so pinning does not nudge the column.
        'relative border-l-[3px] px-5 py-6 transition-colors sm:px-6',
        notice.pinned
          ? 'border-l-gold bg-gold-50/70 dark:bg-gold-950/30'
          : 'border-l-transparent hover:bg-secondary/40',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {notice.pinned ? (
          <Badge variant="gold">
            <Pin className="size-3" aria-hidden="true" />
            Pinned
          </Badge>
        ) : null}

        <Badge variant={variantFor(notice.category)}>{notice.category}</Badge>

        {targeting ? (
          <span className="text-xs font-medium text-muted-foreground">{targeting}</span>
        ) : null}
      </div>

      <h3
        id={titleId}
        className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl"
      >
        {notice.title}
      </h3>

      {summary ? (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {summary}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="font-medium text-foreground">{notice.author.name}</span>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          <time dateTime={notice.publishedAt}>{formatDate(notice.publishedAt)}</time>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
          {relativeTime(notice.publishedAt)}
        </span>

        {notice.attachmentUrl ? (
          <a
            href={notice.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline inline-flex items-center gap-1.5 font-semibold text-primary
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                       focus-visible:ring-offset-2 focus-visible:ring-offset-background
                       dark:text-primary-200"
          >
            <Paperclip className="size-3.5 shrink-0" aria-hidden="true" />
            Attachment
            <span className="sr-only"> for “{notice.title}” (opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </article>
  )
}
