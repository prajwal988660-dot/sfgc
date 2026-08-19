'use client'

import { AdminGuard } from '@/components/admin/admin-guard'
import { GalleryManager } from '@/components/admin/gallery-manager'

export default function AdminGalleryPage() {
  return <AdminGuard>{() => <GalleryManager />}</AdminGuard>
}
