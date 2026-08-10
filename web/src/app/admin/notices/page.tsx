'use client'

import { AdminGuard } from '@/components/admin/admin-guard'
import { NoticesManager } from '@/components/admin/notices-manager'

export default function AdminNoticesPage() {
  return <AdminGuard>{() => <NoticesManager />}</AdminGuard>
}
