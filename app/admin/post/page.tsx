import { requireAdmin } from '@/lib/admin'
import { AdminComposer } from './AdminComposer'

export default async function AdminPostPage() {
  await requireAdmin()

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Create an Admin Announcement</h2>
      <p className="text-[#71767b] mb-8">
        This post will appear on the main feed with an Admin badge.
      </p>
      
      <AdminComposer />
    </div>
  )
}