'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, ChevronRight, Mail, MapPin, Menu, Phone, X } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { COLLEGE, COURSES, DEPARTMENTS, NAV_LINKS } from '@/content/college'
import { cn } from '@/lib/utils'

type NavChild = { label: string; href: string }
type NavItem = { label: string; href: string; children?: readonly NavChild[] }

/** NAV_LINKS is declared `as const`; widen it once so both shapes share a type. */
const NAV: readonly NavItem[] = NAV_LINKS

/**
 * Footnote inside each dropdown. Derived from the content file rather than
 * written here, so it can never drift from the real course/department lists.
 */
const PANEL_NOTE: Record<string, string | undefined> = {
  About: `${COLLEGE.accreditation} · ${COLLEGE.iso}`,
  Academics: `${DEPARTMENTS.length} departments · ${
    COURSES.ug.length + COURSES.pg.length
  } programmes`,
}

const routeOf = (href: string) => href.split('#')[0] || '/'

function isRouteActive(pathname: string, href: string): boolean {
  const route = routeOf(href)
  if (route === '/') return pathname === '/'
  return pathname === route || pathname.startsWith(`${route}/`)
}

/** True when the current route is the item itself or any of its children. */
function isSectionActive(pathname: string, item: NavItem): boolean {
  if (isRouteActive(pathname, item.href)) return true
  return (item.children ?? []).some((child) => isRouteActive(pathname, child.href))
}

const panelIdFor = (label: string) =>
  `nav-panel-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

export function SiteHeader() {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  const [scrolled, setScrolled] = React.useState(false)
  const [openLabel, setOpenLabel] = React.useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const hamburgerRef = React.useRef<HTMLButtonElement>(null)
  const drawerCloseRef = React.useRef<HTMLButtonElement>(null)
  const drawerRef = React.useRef<HTMLDivElement>(null)

  /**
   * Only the homepage puts a dark hero behind the bar, so only there does the
   * navbar start transparent with light type. Every other route starts frosted,
   * which keeps the links legible against a white page from the first pixel.
   */
  const isHome = pathname === '/'
  const overlay = isHome && !scrolled

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // A navigation should never leave a menu hanging open behind it.
  React.useEffect(() => {
    setOpenLabel(null)
    setMobileOpen(false)
  }, [pathname])

  React.useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (mobileOpen) {
        setMobileOpen(false)
        hamburgerRef.current?.focus()
        return
      }
      if (openLabel) {
        const trigger = triggerRefs.current[openLabel]
        setOpenLabel(null)
        trigger?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen, openLabel])

  React.useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  React.useEffect(() => {
    if (!mobileOpen) return
    const id = window.setTimeout(() => drawerCloseRef.current?.focus(), 80)
    return () => window.clearTimeout(id)
  }, [mobileOpen])

  const openPanel = (label: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setOpenLabel(label)
  }

  // A short grace period so the pointer can cross the gap into the panel.
  const schedulePanelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenLabel(null), 140)
  }

  const handleItemBlur = (event: React.FocusEvent<HTMLLIElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    setOpenLabel(null)
  }

  /** Keeps Tab inside the mobile drawer while it is open. */
  const handleDrawerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const root = drawerRef.current
    if (!root) return
    const focusable = root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const navLinkClass = (active: boolean) =>
    cn(
      'link-underline relative rounded-sm py-1 text-[0.9rem] font-semibold tracking-tight',
      'transition-colors focus-visible:outline-none focus-visible:ring-2',
      overlay
        ? 'text-white/85 hover:text-white focus-visible:ring-white'
        : 'text-primary-900/75 hover:text-primary-900 focus-visible:ring-primary dark:text-white/75 dark:hover:text-white',
      active && 'after:w-full',
      active && (overlay ? 'text-white' : 'text-primary-900 dark:text-white'),
    )

  const activeParentLabel = NAV.find(
    (item) => item.children?.length && isSectionActive(pathname, item),
  )?.label

  const closeDrawer = () => setMobileOpen(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 lg:-top-9',
        // On the homepage the header is pulled out of flow so the hero renders
        // behind it. Elsewhere it occupies its own band above the page.
        isHome && '-mb-16 lg:-mb-[7.25rem]',
      )}
    >
      {/* Utility bar — scrolls away, the nav below it stays. */}
      <div className="hidden h-9 bg-primary-950 text-white/75 lg:block">
        <div className="container flex h-full items-center justify-between text-[0.72rem]">
          <div className="flex items-center gap-6">
            <a
              href={COLLEGE.phoneHref}
              className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Phone className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              {COLLEGE.phone}
            </a>
            <a
              href={`mailto:${COLLEGE.email}`}
              className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Mail className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              {COLLEGE.email}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-semibold uppercase tracking-[0.12em] text-gold-200">
              {COLLEGE.accreditation}
            </span>
            <span className="rounded-full border border-white/15 px-2.5 py-0.5 font-semibold uppercase tracking-[0.12em] text-white/70">
              {COLLEGE.iso}
            </span>
          </div>
        </div>
      </div>

      {/* Nav row */}
      <div
        className={cn(
          'transition-[background-color,border-color,box-shadow] duration-300 ease-out',
          overlay
            ? 'border-b border-transparent bg-gradient-to-b from-primary-950/70 via-primary-950/35 to-transparent'
            : 'glass border-x-0 border-t-0 border-b border-border/70',
          scrolled && !overlay && 'shadow-glass',
        )}
      >
        <div className="container flex h-16 items-center justify-between gap-4 lg:h-20">
          <Link
            href="/"
            className={cn(
              'group flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2',
              overlay ? 'focus-visible:ring-white' : 'focus-visible:ring-primary',
            )}
          >
            <Image
              src="/logo.webp"
              alt={COLLEGE.name}
              width={44}
              height={44}
              priority
              className={cn(
                'h-10 w-10 rounded-xl object-cover ring-1 transition-transform duration-300 group-hover:scale-[1.04] lg:h-11 lg:w-11',
                overlay ? 'ring-white/30' : 'ring-primary/15',
              )}
            />
            <span
              className={cn(
                'font-display text-lg font-bold leading-none tracking-tight sm:hidden',
                overlay ? 'text-white' : 'text-primary-900 dark:text-white',
              )}
            >
              {COLLEGE.short}
            </span>
            <span className="hidden flex-col gap-1 sm:flex">
              <span
                className={cn(
                  'font-display text-[0.95rem] font-bold leading-none tracking-tight lg:text-[1.05rem]',
                  overlay ? 'text-white' : 'text-primary-900 dark:text-white',
                )}
              >
                {COLLEGE.name}
              </span>
              <span
                className={cn(
                  'text-[0.68rem] font-medium leading-none tracking-[0.06em]',
                  overlay ? 'text-white/65' : 'text-muted-foreground',
                )}
              >
                {COLLEGE.location} · Est. {COLLEGE.established}
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {NAV.map((item) => {
                const children = item.children
                const active = isSectionActive(pathname, item)

                if (!children?.length) {
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={navLinkClass(active)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                }

                const panelId = panelIdFor(item.label)
                const isOpen = openLabel === item.label
                const note = PANEL_NOTE[item.label]

                return (
                  <li
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => openPanel(item.label)}
                    onMouseLeave={schedulePanelClose}
                    onFocus={() => openPanel(item.label)}
                    onBlur={handleItemBlur}
                  >
                    <button
                      type="button"
                      ref={(node) => {
                        triggerRefs.current[item.label] = node
                      }}
                      // Disclosure semantics, not a menu: the panel holds links,
                      // so aria-expanded + aria-controls is the correct pairing.
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      aria-current={
                        isRouteActive(pathname, item.href) ? 'page' : undefined
                      }
                      onClick={() => setOpenLabel(isOpen ? null : item.label)}
                      className={cn(navLinkClass(active), 'inline-flex items-center gap-1')}
                    >
                      {item.label}
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          'h-3.5 w-3.5 transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen ? (
                        <motion.div
                          key={panelId}
                          id={panelId}
                          initial={{ opacity: 0, y: 10, x: '-50%' }}
                          animate={{ opacity: 1, y: 0, x: '-50%' }}
                          exit={{ opacity: 0, y: 6, x: '-50%' }}
                          transition={{
                            duration: reduceMotion ? 0.12 : 0.2,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="absolute left-1/2 top-full w-72 pt-4"
                        >
                          <div className="glass overflow-hidden rounded-2xl shadow-glass">
                            <ul className="p-2">
                              {children.map((child) => {
                                // Hash links share a route, so only an exact match
                                // counts — otherwise every "/about#…" child would
                                // light up at once.
                                const childActive = pathname === child.href
                                return (
                                  <li key={child.href}>
                                    <Link
                                      href={child.href}
                                      aria-current={childActive ? 'page' : undefined}
                                      className={cn(
                                        'group/link flex items-center justify-between gap-3 rounded-xl px-3 py-2.5',
                                        'text-sm font-medium text-primary-900 transition-colors',
                                        'hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                        'dark:text-white dark:hover:bg-white/10',
                                        childActive && 'bg-primary/5 dark:bg-white/10',
                                      )}
                                    >
                                      {child.label}
                                      <ChevronRight
                                        aria-hidden="true"
                                        className="h-4 w-4 -translate-x-1 text-gold opacity-0 transition-all duration-200 group-hover/link:translate-x-0 group-hover/link:opacity-100"
                                      />
                                    </Link>
                                  </li>
                                )
                              })}
                            </ul>
                            {note ? (
                              <p className="border-t border-border/60 bg-secondary/70 px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                                {note}
                              </p>
                            ) : null}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden md:inline-flex" />

            <Button asChild variant="gold" size="sm" className="hidden sm:inline-flex lg:h-11 lg:px-6 lg:text-sm">
              <Link href="/admissions">Apply Now</Link>
            </Button>

            <button
              ref={hamburgerRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="site-mobile-menu"
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors lg:hidden',
                'focus-visible:outline-none focus-visible:ring-2',
                overlay
                  ? 'border-white/25 text-white hover:bg-white/10 focus-visible:ring-white'
                  : 'border-border text-primary-900 hover:bg-secondary focus-visible:ring-primary dark:text-white',
              )}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-primary-950/60 backdrop-blur-sm lg:hidden"
          />
        ) : null}

        {mobileOpen ? (
          <motion.div
            key="drawer-panel"
            ref={drawerRef}
            id="site-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={`${COLLEGE.short} navigation`}
            onKeyDown={handleDrawerKeyDown}
            initial={reduceMotion ? { opacity: 0 } : { x: '100%' }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: '100%' }}
            transition={{
              duration: reduceMotion ? 0.15 : 0.34,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="fixed right-0 top-0 z-50 flex h-[100dvh] w-[min(22rem,88vw)] flex-col bg-background shadow-lift lg:hidden"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.webp"
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-lg object-cover ring-1 ring-primary/15"
                />
                <span className="flex flex-col gap-1">
                  <span className="font-display text-sm font-bold leading-none text-primary-900 dark:text-white">
                    {COLLEGE.short}
                  </span>
                  <span className="text-[0.65rem] leading-none text-muted-foreground">
                    {COLLEGE.location}
                  </span>
                </span>
              </div>
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={closeDrawer}
                aria-label="Close navigation menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-primary-900 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain">
              <Accordion
                type="single"
                collapsible
                defaultValue={activeParentLabel}
                className="px-5"
              >
                {NAV.map((item) => {
                  const children = item.children
                  const active = isSectionActive(pathname, item)

                  if (!children?.length) {
                    return (
                      <div key={item.label} className="border-b border-border">
                        <Link
                          href={item.href}
                          onClick={closeDrawer}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center justify-between gap-3 py-4 text-base font-semibold',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                            active
                              ? 'text-maroon-700 dark:text-gold-300'
                              : 'text-primary-900 dark:text-white',
                          )}
                        >
                          {item.label}
                          <ChevronRight
                            aria-hidden="true"
                            className="h-4 w-4 text-muted-foreground"
                          />
                        </Link>
                      </div>
                    )
                  }

                  return (
                    <AccordionItem key={item.label} value={item.label}>
                      <AccordionTrigger
                        className={cn(
                          'py-4 text-base font-semibold',
                          active
                            ? 'text-maroon-700 dark:text-gold-300'
                            : 'text-primary-900 dark:text-white',
                        )}
                      >
                        {item.label}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pr-0">
                        <ul className="space-y-0.5 border-l-2 border-gold/40 pl-4">
                          {children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={closeDrawer}
                                aria-current={pathname === child.href ? 'page' : undefined}
                                className="block rounded-md py-2 text-sm font-medium text-primary-900/75 transition-colors hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-white/75 dark:hover:text-white"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </nav>

            <div className="border-t border-border bg-secondary/50 px-5 py-5">
              <Button asChild variant="gold" className="w-full">
                <Link href="/admissions" onClick={closeDrawer}>
                  Apply Now
                </Link>
              </Button>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>

              <ul className="mt-5 space-y-3 text-sm text-primary-900/75 dark:text-white/70">
                <li>
                  <a
                    href={COLLEGE.phoneHref}
                    className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-300" aria-hidden="true" />
                    {COLLEGE.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${COLLEGE.email}`}
                    className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-300" aria-hidden="true" />
                    {COLLEGE.email}
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-600 dark:text-gold-300" aria-hidden="true" />
                  <span>{COLLEGE.addressLines.slice(1).join(', ')}</span>
                </li>
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
