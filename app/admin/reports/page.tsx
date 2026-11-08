import { requireAdmin } from '@/lib/admin'
import { PageHeader } from '@/components/admin/PageHeader'
import { ReportList } from './ReportList'

export default async function ReportsPage() {
  const { supabase } = await requireAdmin()

  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id,
      reason,
      created_at,
      reporter_id,
      post_id,
      reply_id,
      posts ( id, content, author_id, created_at ),
      replies ( id, content, author_id, created_at, post_id )
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader title="Reports" description="Review flagged posts and replies." />
      <ReportList initialReports={(reports as any) || []} />
    </div>
  )
}