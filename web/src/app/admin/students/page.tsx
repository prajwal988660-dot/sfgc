'use client'

import { AdminGuard } from '@/components/admin/admin-guard'
import { StudentsManager } from '@/components/admin/students-manager'

export default function AdminStudentsPage() {
  return <AdminGuard>{() => <StudentsManager />}</AdminGuard>
}
