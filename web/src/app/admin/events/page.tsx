'use client'

import { AdminGuard } from '@/components/admin/admin-guard'
import { EventsManager } from '@/components/admin/events-manager'

export default function AdminEventsPage() {
  return <AdminGuard>{() => <EventsManager />}</AdminGuard>
}
