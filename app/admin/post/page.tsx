import { requireAdmin } from '@/lib/admin'
import { PageHeader } from '@/components/admin/PageHeader'
import { AdminComposer } from './AdminComposer'

export default async function AdminPostPage() {
  await requireAdmin()

  return (
    <div>
      <PageHeader
        title="New announcement"
        description="This appears on the main feed with an Admin badge."
      />
      <AdminComposer />
    </div>
  )
}