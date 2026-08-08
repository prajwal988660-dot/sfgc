import type { MetadataRoute } from 'next'

import { COLLEGE } from '@/content/college'

/** `COLLEGE.website` carries a trailing slash; sitemap URLs must not double it. */
const BASE_URL = COLLEGE.website.replace(/\/$/, '')

type Route = {
  path: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
}

/**
 * Ordered by how often the page actually changes, not by nav order. Events and
 * notices are backed by the API and turn over constantly; the prospectus-style
 * pages move once or twice a year.
 */
const ROUTES: readonly Route[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/admissions', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/departments', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/events', changeFrequency: 'daily', priority: 0.8 },
  { path: '/notices', changeFrequency: 'daily', priority: 0.8 },
  { path: '/placements', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
