import type { RequestHandler } from 'express'

/**
 * Cache headers for endpoints the public reads.
 *
 * The API sleeps after ~15 minutes idle on its current host and takes about 38
 * seconds to wake. `stale-while-revalidate` is the part that matters most here:
 * a shared cache may serve the last good copy while the origin is still coming
 * back, so a visitor arriving first thing in the morning reads slightly stale
 * notices instead of watching a spinner for half a minute.
 */

/**
 * Marks a response as publicly cacheable — but ONLY when the request carried no
 * credentials.
 *
 * Several of these endpoints change shape for staff: `GET /events` and
 * `GET /gallery` include unpublished drafts for someone holding the right
 * permission, and `GET /notices` scopes by audience. A shared cache that stored
 * one of those and replayed it to an anonymous visitor would leak a draft. So
 * an authenticated request is marked `no-store` and never cached at all, and
 * `Vary: Authorization` tells every intermediary that the two are different
 * responses rather than one.
 *
 * `max-age=0` keeps the BROWSER honest — a student pulling to refresh gets a
 * fresh answer — while `s-maxage` lets the CDN in front absorb the repeat
 * traffic. Those are deliberately different numbers, not an oversight.
 *
 * @param seconds how long a shared cache may serve this without revalidating
 */
export function publicCache(seconds: number): RequestHandler {
  return (req, res, next) => {
    // Vary is set in both branches. Omitting it on the private branch is the
    // classic way a personalised response ends up in a shared cache.
    res.setHeader('Vary', 'Authorization')

    if (req.headers.authorization) {
      res.setHeader('Cache-Control', 'private, no-store')
    } else {
      res.setHeader(
        'Cache-Control',
        `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 10}`,
      )
    }
    next()
  }
}

/**
 * Editorial content — notices, events, gallery.
 *
 * Sixty seconds matches the `revalidate = 60` the website's pages already use,
 * so the two layers agree rather than fighting: there is no point caching for
 * five minutes behind a page that refetches every one.
 */
export const cachePublicContent = publicCache(60)

/**
 * Counters on the homepage. Nobody is materially misled by a five-minute-old
 * student count, and this is the read most likely to be hit by a crawler.
 */
export const cachePublicStats = publicCache(300)
