'use client'

import { AdminGuard } from '@/components/admin/admin-guard'
import { ClassesManager } from '@/components/admin/classes-manager'

export default function AdminClassesPage() {
  return <AdminGuard>{() => <ClassesManager />}</AdminGuard>
}
