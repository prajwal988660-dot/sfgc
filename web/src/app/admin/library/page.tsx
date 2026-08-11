'use client'

import { AdminGuard } from '@/components/admin/admin-guard'
import { LibraryManager } from '@/components/admin/library-manager'

export default function AdminLibraryPage() {
  return <AdminGuard>{() => <LibraryManager />}</AdminGuard>
}
