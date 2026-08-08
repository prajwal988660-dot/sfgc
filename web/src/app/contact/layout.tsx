import type { Metadata } from 'next'

import { COLLEGE } from '@/content/college'

/**
 * The contact page itself is a Client Component, because the enquiry form needs
 * state — and Next.js forbids a client module from exporting `metadata`. This
 * segment layout is a Server Component, so the route still gets proper SEO
 * without splitting the page apart.
 */
export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Get in touch with ${COLLEGE.name}, ${COLLEGE.location}. Phone ${COLLEGE.phone}, email ${COLLEGE.email}. Campus address, office hours, enquiry form and directions.`,
  alternates: { canonical: '/contact' },
  openGraph: {
    title: `Contact ${COLLEGE.short}`,
    description: `${COLLEGE.addressLines.join(', ')} · ${COLLEGE.phone}`,
    type: 'website',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
