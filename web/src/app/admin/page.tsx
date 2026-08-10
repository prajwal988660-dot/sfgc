'use client'

import Link from 'next/link'
import { CalendarDays, Image as ImageIcon, Megaphone } from 'lucide-react'

import { AdminGuard } from '@/components/admin/admin-guard'

const CARDS = [
  {
    href: '/admin/notices',
    icon: Megaphone,
    title: 'Notices',
    blurb: 'Post, edit or remove notices. They appear on the website and in both apps.',
  },
  {
    href: '/admin/events',
    icon: CalendarDays,
    title: 'Events',
    blurb: 'Add events with a cover picture, manage seats and close registrations.',
  },
  {
    href: '/admin/media',
    icon: ImageIcon,
    title: 'Pictures',
    blurb: 'Upload an image and copy its link to use anywhere on the site.',
  },
] as const

export default function AdminHomePage() {
  return (
    <AdminGuard>
      {(user) => (
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-2xl font-semibold">
              Welcome, {user.name.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Changes here go live on the website within a minute.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((card) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-card
                             transition-shadow hover:shadow-lift"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-lg font-semibold">{card.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{card.blurb}</p>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </AdminGuard>
  )
}
