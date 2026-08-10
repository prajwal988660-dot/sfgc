import type { MetadataRoute } from 'next'

import { COLLEGE } from '@/content/college'

/** `COLLEGE.website` carries a trailing slash; the sitemap URL must not double it. */
const BASE_URL = COLLEGE.website.replace(/\/$/, '')

/**
 * Everything a visitor is meant to read is crawlable. /admin is the one
 * exception — the staff panel behind it is protected by a password, not by
 * being unlisted, but keeping it out of search results spares it the constant
 * background traffic of bots probing login forms.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/admin' }],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
