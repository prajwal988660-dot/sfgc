'use client'

import { AdminGuard } from '@/components/admin/admin-guard'
import { AdmissionsManager } from '@/components/admin/admissions-manager'

export default function AdminAdmissionsPage() {
  return <AdminGuard>{() => <AdmissionsManager />}</AdminGuard>
}
