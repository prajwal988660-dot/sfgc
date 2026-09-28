import Image from 'next/image'
import Link from 'next/link'
import {
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Youtube,
  type LucideIcon,
} from 'lucide-react'

import { BADGES, COLLEGE, NAV_LINKS, WELCOME } from '@/content/college'

type FooterLink = { label: string; href: string }

/** NAV_LINKS is declared `as const`; widen it once for iteration. */
const EXPLORE: readonly FooterLink[] = NAV_LINKS

/**
 * The second list reuses NAV_LINKS entries rather than restating their routes,
 * so a route rename in the content file cannot leave a dead link down here.
 */
const QUICK_ACCESS: FooterLink[] = [
  ...(['Admissions', 'Placements', 'Notices', 'Events'] as const)
    .map((label) => EXPLORE.find((item) => item.label === label))
    .filter((item): item is FooterLink => Boolean(item)),
  // Not a NAV_LINKS route — an anchor into the homepage download section.
  { label: 'Download the apps', href: '/#apps' },
]

const SOCIAL_ICONS: Record<string, LucideIcon | undefined> = {
  Facebook,
  Instagram,
  YouTube: Youtube,
  LinkedIn: Linkedin,
}

/** "www.sfgc.ac.in/" → "sfgc.ac.in", so the domain is never restated by hand. */
const officialDomain = new URL(COLLEGE.website).hostname.replace(/^www\./, '')

const headingClass =
  'text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-300'

const linkClass =
  'rounded-sm text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary-950 text-white">
      {/* Gold hairline along the top edge. */}
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent"
      />

      <div className="container py-14 md:py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* 1 — identity */}
          <div className="lg:col-span-3">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
            >
              <Image
                src="/logo.webp"
                alt={COLLEGE.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/20"
              />
              <span className="flex flex-col gap-1">
                <span className="font-display text-base font-bold leading-none">
                  {COLLEGE.short}
                </span>
                <span className="text-[0.68rem] leading-none text-white/60">
                  {COLLEGE.location} · Est. {COLLEGE.established}
                </span>
              </span>
            </Link>

            <p className="mt-5 text-sm leading-relaxed text-white/70">{WELCOME[1]}</p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {BADGES.map((badge) => (
                <li
                  key={badge.label}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
                >
                  <span className="block text-[0.7rem] font-bold leading-tight text-gold-200">
                    {badge.label}
                  </span>
                  <span className="block text-[0.6rem] uppercase tracking-[0.12em] text-white/55">
                    {badge.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2 — navigation */}
          <nav aria-label="Footer" className="lg:col-span-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-8">
              <div>
                <h2 className={headingClass}>Explore</h2>
                <ul className="mt-4 space-y-2.5">
                  {EXPLORE.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className={headingClass}>Quick access</h2>
                <ul className="mt-4 space-y-2.5">
                  {QUICK_ACCESS.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <a
                      href={COLLEGE.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${linkClass} inline-flex items-center gap-1.5`}
                    >
                      Official site
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </nav>

          {/* 3 — contact */}
          <div className="lg:col-span-3">
            <h2 className={headingClass}>Contact</h2>

            <address className="mt-4 not-italic">
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-white/70">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                <span>
                  {COLLEGE.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </p>

              <p className="mt-4">
                <a
                  href={COLLEGE.phoneHref}
                  className={`${linkClass} inline-flex items-center gap-2.5`}
                >
                  <Phone className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                  {COLLEGE.phone}
                </a>
              </p>
              <p className="mt-2.5">
                <a
                  href={`mailto:${COLLEGE.email}`}
                  className={`${linkClass} inline-flex items-center gap-2.5`}
                >
                  <Mail className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                  {COLLEGE.email}
                </a>
              </p>
              <p className="mt-2.5">
                <a
                  href={`mailto:${COLLEGE.admissionsEmail}`}
                  className={`${linkClass} inline-flex items-center gap-2.5`}
                >
                  <Mail className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                  {COLLEGE.admissionsEmail}
                </a>
              </p>
            </address>

            <ul className="mt-6 flex items-center gap-2">
              {COLLEGE.socials.map((social) => {
                const Icon = SOCIAL_ICONS[social.label] ?? Globe
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${COLLEGE.short} on ${social.label}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition-colors hover:border-gold/50 hover:bg-gold/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* 4 — map */}
          <div className="lg:col-span-3">
            <h2 className={headingClass}>Find us</h2>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <div className="aspect-[16/10]">
                <iframe
                  src={COLLEGE.mapEmbed}
                  title={`Google Map showing ${COLLEGE.name}, ${COLLEGE.location}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                />
              </div>
            </div>

            <a
              href={COLLEGE.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-gold-200 transition-colors hover:text-gold-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
            >
              Get directions
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-4 py-6 text-xs leading-relaxed text-white/60 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <p>
              © {year} {COLLEGE.name}, {COLLEGE.location}.
            </p>
            <p className="max-w-2xl text-white/50">{COLLEGE.affiliation}.</p>
          </div>

          {/* Required disclaimer: this build is a student project, not the
              institution's own site, and must say so on every page. */}
          <p className="max-w-md text-white/50 lg:text-right">
            A student-built recreation of the college website, made for learning. This is
            not the official {COLLEGE.short} site — visit{' '}
            <a
              href={COLLEGE.website}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline font-semibold text-gold-200 transition-colors hover:text-gold-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
            >
              {officialDomain}
            </a>{' '}
            for official information.
          </p>
        </div>
      </div>
    </footer>
  )
}
