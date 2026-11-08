import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { PageHeader } from '@/components/admin/PageHeader'
import { AdminPostList } from '@/components/admin/AdminPostList'

function Stat({
  label,
  value,
  href,
  alert,
}: {
  label: string
  value: number
  href?: string
  alert?: boolean
}) {
  const body = (
    <>
      <p className="text-[12px] text-[#6b6b6b]">{label}</p>
      <p className={`mt-1 text-[26px] font-bold tabular-nums ${alert ? 'text-[#ff4d6d]' : 'text-white'}`}>
        {value}
      </p>
    </>
  )
  const cls = 'rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4'
  return href ? (
    <Link href={href} className={`${cls} transition hover:bg-[#1e1e1e]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [posts, today, replies, reports, recent] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('replies').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(8),
  ])

  const openReports = reports.count ?? 0

  return (
    <div>
      <PageHeader title="Dashboard" description="What's happening on campus right now." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total posts" value={posts.count ?? 0} href="/admin/posts" />
        <Stat label="Posts in 24h" value={today.count ?? 0} />
        <Stat label="Total replies" value={replies.count ?? 0} />
        <Stat label="Open reports" value={openReports} href="/admin/reports" alert={openReports > 0} />
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Recent posts</h2>
        <Link href="/admin/posts" className="text-[13px] font-semibold text-[#9a9a9a] transition hover:text-white">
          View all
        </Link>
      </div>

      <AdminPostList initialPosts={recent.data ?? []} emptyText="No posts yet." />
    </div>
  )
}