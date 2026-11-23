import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { PageHeader } from '@/components/admin/PageHeader'

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
      <p className="text-[12px] text-[#6b6b6b]">{label}</p>
      <p className="mt-1 text-[26px] font-bold tabular-nums text-white">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[#6b6b6b]">{hint}</p>}
    </div>
  )
}

function BarChart({
  data,
  max,
  label,
}: {
  data: { label: string; value: number }[]
  max: number
  label: string
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
      <p className="text-[13px] font-semibold text-white">{label}</p>
      <div className="mt-3 flex h-32 items-end gap-1">
        {data.map((d) => (
          <div key={d.label} className="group relative flex-1">
            <div
              className="w-full rounded-t bg-[#1d9bf0]/60 transition group-hover:bg-[#1d9bf0]"
              style={{ height: `${max > 0 ? (d.value / max) * 100 : 0}%` }}
            />
            <div className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#222] px-2 py-0.5 text-[11px] text-white group-hover:block">
              {d.label}: {d.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[#6b6b6b]">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const days = Math.max(7, Math.min(90, Number(sp.days ?? 30)))
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString()

  const [
    postsRes,
    repliesRes,
    visitorsRes,
    topPostersRes,
    categoryRes,
  ] = await Promise.all([
    // Posts in window (for the daily chart and totals)
    supabase
      .from('posts')
      .select('id, created_at, category, author_id, like_count')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true }),

    // Replies in window (for reply-per-post ratio)
    supabase
      .from('replies')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cutoff),

    // Visitors in window (unique users)
    supabase
      .from('user_visits')
      .select('user_id', { count: 'exact', head: true })
      .gte('last_seen_at', cutoff),

    // Top posters by count in window
    supabase.rpc('top_posters', { p_days: days, p_limit: 10 }),

    // All posts by category in window (small; group client-side)
    supabase
      .from('posts')
      .select('category', { count: 'exact', head: false })
      .gte('created_at', cutoff),
  ])

  const posts = postsRes.data ?? []
  const replyCount = repliesRes.count ?? 0
  const visitorCount = visitorsRes.count ?? 0
  const topPosters = (topPostersRes.data ?? []) as {
    nickname: string | null
    post_count: number
  }[]

  // Bucket posts by day
  const dailyMap = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000)
    const key = d.toISOString().slice(0, 10)
    dailyMap.set(key, 0)
  }
  for (const p of posts) {
    const key = p.created_at.slice(0, 10)
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1)
  }
  const dailyData = [...dailyMap.entries()].map(([date, count]) => ({
    label: date.slice(5), // MM-DD
    value: count,
  }))
  const dailyMax = Math.max(...dailyData.map((d) => d.value), 1)

  // Category mix
  const categoryMap = new Map<string, number>()
  for (const p of categoryRes.data ?? []) {
    const c = (p as any).category as string
    categoryMap.set(c, (categoryMap.get(c) ?? 0) + 1)
  }
  const categoryData = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n]) => ({ category: cat, count: n }))
  const categoryMax = Math.max(...categoryData.map((c) => c.count), 1)

  // Derived
  const totalPosts = posts.length
  const postsPerDay = days > 0 ? (totalPosts / days).toFixed(1) : '0'
  const repliesPerPost =
    totalPosts > 0 ? (replyCount / totalPosts).toFixed(2) : '0.00'

  // Lurkers: visitors in window who didn't post in window
  const posterIds = new Set(posts.map((p) => p.author_id))
  const lurkerRatio =
    visitorCount > 0
      ? Math.max(0, visitorCount - posterIds.size) / visitorCount
      : 0

  return (
    <div>
      <PageHeader
        title="Insights"
        description={`Engagement over the last ${days} days.`}
      />

      <div className="mb-4 flex gap-2">
        {[7, 30, 90].map((d) => (
          <Link
            key={d}
            href={`/admin/insights?days=${d}`}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${
              d === days
                ? 'border-white bg-white text-black'
                : 'border-[#2a2a2a] text-[#9a9a9a] hover:border-[#444] hover:text-white'
            }`}
          >
            {d}d
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total posts" value={totalPosts} hint={`${postsPerDay}/day`} />
        <Stat label="Total replies" value={replyCount} hint={`${repliesPerPost}/post`} />
        <Stat
          label="Lurkers"
          value={`${Math.round(lurkerRatio * 100)}%`}
          hint="readers who didn't post"
        />
        <Stat label="Visitors" value={visitorCount} hint={`in ${days}d`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BarChart data={dailyData} max={dailyMax} label="Posts per day" />

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
          <p className="text-[13px] font-semibold text-white">Category mix</p>
          {categoryData.length === 0 ? (
            <p className="mt-3 text-[12px] text-[#6b6b6b]">No posts yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {categoryData.map((c) => (
                <div key={c.category} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-[12px] capitalize text-[#9a9a9a]">
                    {c.category}
                  </span>
                  <div className="flex-1 rounded-full bg-[#222]">
                    <div
                      className="h-2 rounded-full bg-[#1d9bf0]"
                      style={{ width: `${(c.count / categoryMax) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[12px] tabular-nums text-white">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
        <p className="text-[13px] font-semibold text-white">Top posters</p>
        {topPosters.length === 0 ? (
          <p className="mt-2 text-[12px] text-[#6b6b6b]">No posts in this window.</p>
        ) : (
          <ol className="mt-3 space-y-1.5">
            {topPosters.map((p, i) => (
              <li key={`${p.nickname ?? 'anon'}-${i}`} className="flex items-center gap-3 text-[13px]">
                <span className="w-4 text-right text-[#6b6b6b] tabular-nums">{i + 1}.</span>
                <span className="flex-1 truncate text-white">
                  {p.nickname ?? <span className="text-[#6b6b6b]">anon</span>}
                </span>
                <span className="tabular-nums text-[#9a9a9a]">{p.post_count} posts</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}