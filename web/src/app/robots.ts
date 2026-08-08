import type { MetadataRoute } from 'next'

import { COLLEGE } from '@/content/college'

/** `COLLEGE.website` carries a trailing slash; the sitemap URL must not double it. */
const BASE_URL = COLLEGE.website.replace(/\/$/, '')

/**
 * The public site is entirely public — there is nothing here a crawler should
 * be kept out of, so every user agent is allowed everything.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
