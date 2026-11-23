import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { PageHeader } from '@/components/admin/PageHeader'
import { VisitorTable } from '@/components/admin/VisitorTable'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
      <p className="text-[12px] text-[#6b6b6b]">{label}</p>
      <p className="mt-1 text-[26px] font-bold tabular-nums text-white">{value}</p>
    </div>
  )
}

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; page?: string }>
}) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const days = Math.max(1, Math.min(90, Number(sp.days ?? 7)))
  const page = Math.max(1, Number(sp.page ?? 1))
  const perPage = 50
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString()

  const [statsRes, listRes] = await Promise.all([
    supabase.rpc('visitor_stats', { p_days: days }),
    supabase
      .from('user_visits')
      .select('user_id, first_seen_at, last_seen_at', { count: 'exact' })
      .gte('last_seen_at', cutoff)
      .order('last_seen_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1),
  ])

  const stats = statsRes.data?.[0] as
    | { total_visitors: number; new_in_window: number; returning_in_window: number }
    | undefined
  const list = listRes.data ?? []
  const total = listRes.count ?? 0

  const userIds = list.map((r) => r.user_id)
  const { data: profiles } = userIds.length
    ? await supabase
        .from('profiles')
        .select('user_id, nickname, banned_until')
        .in('user_id', userIds)
    : {
        data: [] as {
          user_id: string
          nickname: string | null
          banned_until: string | null
        }[],
      }

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.user_id,
      { nickname: p.nickname as string | null, bannedUntil: p.banned_until as string | null },
    ])
  )

  const rows = list.map((r) => {
    const prof = profileMap.get(r.user_id)
    return {
      user_id: r.user_id,
      first_seen_at: r.first_seen_at,
      last_seen_at: r.last_seen_at,
      nickname: prof?.nickname ?? null,
      bannedUntil: prof?.bannedUntil ?? null,
    }
  })

  return (
    <div>
      <PageHeader title="Visitors" description={`Users seen in the last ${days} days.`} />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="All-time visitors" value={Number(stats?.total_visitors ?? 0)} />
        <Stat label={`New in ${days}d`} value={Number(stats?.new_in_window ?? 0)} />
        <Stat label={`Returning in ${days}d`} value={Number(stats?.returning_in_window ?? 0)} />
      </div>

      <div className="mt-6 flex gap-2">
        {[1, 7, 30, 90].map((d) => (
          <Link
            key={d}
            href={`/admin/visitors?days=${d}`}
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

      <VisitorTable rows={rows} />

      {total > perPage && (
        <div className="mt-4 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/visitors?days=${days}&page=${page - 1}`}
              className="rounded-full border border-[#2a2a2a] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#222]"
            >
              Newer
            </Link>
          )}
          {page * perPage < total && (
            <Link
              href={`/admin/visitors?days=${days}&page=${page + 1}`}
              className="rounded-full border border-[#2a2a2a] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#222]"
            >
              Older
            </Link>
          )}
        </div>
      )}
    </div>
  )
}