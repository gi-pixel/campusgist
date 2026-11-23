import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { PageHeader } from '@/components/admin/PageHeader'

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

  // Fetch nicknames for the users on this page
  const userIds = list.map((r) => r.user_id)
  const { data: profiles } = userIds.length
    ? await supabase
        .from('profiles')
        .select('user_id, nickname')
        .in('user_id', userIds)
    : { data: [] as { user_id: string; nickname: string | null }[] }

  const nicknames = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.nickname])
  )

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

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#181818]">
        {list.length === 0 ? (
          <p className="p-8 text-center text-[14px] text-[#6b6b6b]">No visits in this window.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-[#1e1e1e] text-left text-[#9a9a9a]">
              <tr>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">First seen</th>
                <th className="px-4 py-2.5 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const nickname = nicknames.get(row.user_id)
                return (
                  <tr key={row.user_id} className="border-t border-[#2a2a2a]">
                    <td className="px-4 py-2.5 text-white">
                      {nickname ?? (
                        <span className="font-mono text-[12px] text-[#6b6b6b]">
                          anon · {row.user_id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[#9a9a9a]" suppressHydrationWarning>
                      {new Date(row.first_seen_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-[#9a9a9a]" suppressHydrationWarning>
                      {new Date(row.last_seen_at).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

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