import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import { Toaster } from 'sonner'

import './globals.css'
import { COLLEGE } from '@/content/college'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteChrome } from '@/components/layout/site-chrome'
import { themeInitScript } from '@/lib/theme'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['SOFT', 'WONK'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.sfgc.ac.in'),
  title: {
    default: `${COLLEGE.name} — ${COLLEGE.short}`,
    template: `%s · ${COLLEGE.short}`,
  },
  description: `${COLLEGE.name}, ${COLLEGE.location}. ${COLLEGE.accreditation}, ${COLLEGE.iso}. UG and PG programmes in commerce, management, computer applications and science.`,
  keywords: [
    'SFGC',
    'Seshadripuram First Grade College',
    'Yelahanka college',
    'Bengaluru degree college',
    'BCA BBA B.Com MBA MCA',
    'NAAC A+ college Bangalore',
  ],
  authors: [{ name: COLLEGE.name }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: COLLEGE.name,
    title: `${COLLEGE.name} — ${COLLEGE.tagline}`,
    description: `${COLLEGE.accreditation} · ${COLLEGE.affiliation}`,
  },
  twitter: {
    card: 'summary_large_image',
    title: COLLEGE.name,
    description: COLLEGE.tagline,
  },
  icons: { icon: '/logo.webp', apple: '/logo.webp' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        {/* Sets the `dark` class before first paint so the theme never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} font-sans`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]
                     focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm
                     focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>

        <SiteChrome header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </SiteChrome>

        <Toaster
          position="top-center"
          richColors
          toastOptions={{ style: { borderRadius: '0.9rem' } }}
        />
      </body>
    </html>
  )
}
