import { requireAdmin } from '@/lib/admin'
import { ReportList } from './ReportList'

export default async function ReportsPage() {
  const { supabase } = await requireAdmin()

  // Fetch open reports, and join BOTH posts and replies
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
      <h2 className="text-2xl font-bold mb-6">Reports Queue</h2>
      <p className="text-[#71767b] mb-8">
        Review flagged posts and replies.
      </p>

      <ReportList initialReports={reports || []} />
    </div>
  )
}