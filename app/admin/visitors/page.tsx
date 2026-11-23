import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { PageHeader } from '@/components/admin/PageHeader'
import { BanButton } from '@/components/admin/BanButton'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
      <p className="text-[12px] text-[#6b6b6b]">{label}</p>
      <p className="mt-1 text-[26px] font-bold tabular-nums text-white">{value}</p>
    </div>
  )
}

function VisitorSearchBar({
  days,
  q,
}: {
  days: number
  q: string
}) {
  return (
    <form method="get" className="mt-4 flex gap-2">
      <input type="hidden" name="days" value={days} />
      <input
        name="q"
        defaultValue={q}
        placeholder="Search by nickname"
        className="min-w-0 flex-1 rounded-full bg-[#222] px-4 py-2.5 text-[15px] text-white outline-none placeholder:text-[#6b6b6b]"
      />
      <button
        type="submit"
        className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-black transition hover:bg-[#e6e6e6]"
      >
        Search
      </button>
      {q && (
        <Link
          href={`/admin/visitors?days=${days}`}
          className="rounded-full border border-[#2a2a2a] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#222]"
        >
          Clear
        </Link>
      )}
    </form>
  )
}

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; page?: string; q?: string }>
}) {
  const { supabase } = await requireAdmin()
  const sp = await searchParams
  const days = Math.max(1, Math.min(90, Number(sp.days ?? 7)))
  const page = Math.max(1, Number(sp.page ?? 1))
  const q = (sp.q ?? '').trim()
  const perPage = 50
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString()

  // If searching by nickname, resolve matching user_ids first.
  let matchedIds: string[] | null = null
  if (q) {
    const { data: matches } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('nickname', `%${q.replace(/[\\%_]/g, '\\$&')}%`)
      .limit(500)
    matchedIds = (matches ?? []).map((m) => m.user_id)
  }

  const [statsRes, listRes] = await Promise.all([
    supabase.rpc('visitor_stats', { p_days: days }),
    (() => {
      let query = supabase
        .from('user_visits')
        .select('user_id, first_seen_at, last_seen_at', { count: 'exact' })
        .gte('last_seen_at', cutoff)
        .order('last_seen_at', { ascending: false })

      if (matchedIds !== null) {
        if (matchedIds.length === 0) {
          // Search matched nobody: return an empty query deliberately
          query = query.in('user_id', ['00000000-0000-0000-0000-000000000000'])
        } else {
          query = query.in('user_id', matchedIds)
        }
      }

      return query.range((page - 1) * perPage, page * perPage - 1)
    })(),
  ])

  const stats = statsRes.data?.[0] as
    | { total_visitors: number; new_in_window: number; returning_in_window: number }
    | undefined
  const list = listRes.data ?? []
  const total = listRes.count ?? 0

  // Fetch profile data for users on this page
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
            href={`/admin/visitors?days=${d}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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

      <VisitorSearchBar days={days} q={q} />

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#181818]">
        {list.length === 0 ? (
          <p className="p-8 text-center text-[14px] text-[#6b6b6b]">
            {q ? `No visitors match "${q}".` : 'No visits in this window.'}
          </p>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-[#1e1e1e] text-left text-[#9a9a9a]">
              <tr>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">First seen</th>
                <th className="px-4 py-2.5 font-medium">Last seen</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const prof = profileMap.get(row.user_id)
                const nickname = prof?.nickname ?? null
                const bannedUntil = prof?.bannedUntil ?? null
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
                    <td className="px-4 py-2.5 text-right">
                      <BanButton userId={row.user_id} bannedUntil={bannedUntil} />
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
              href={`/admin/visitors?days=${days}&page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className="rounded-full border border-[#2a2a2a] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#222]"
            >
              Newer
            </Link>
          )}
          {page * perPage < total && (
            <Link
              href={`/admin/visitors?days=${days}&page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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