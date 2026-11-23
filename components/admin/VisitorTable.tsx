'use client'

import { useMemo, useState } from 'react'
import { BanButton } from './BanButton'

type Row = {
  user_id: string
  first_seen_at: string
  last_seen_at: string
  nickname: string | null
  bannedUntil: string | null
}

export function VisitorTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const name = (r.nickname ?? `anon ${r.user_id}`).toLowerCase()
      return name.includes(q)
    })
  }, [rows, query])

  return (
    <div>
      <div className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search loaded visitors by nickname"
          className="min-w-0 flex-1 rounded-full bg-[#222] px-4 py-2.5 text-[15px] text-white outline-none placeholder:text-[#6b6b6b]"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="rounded-full border border-[#2a2a2a] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#222]"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#181818]">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-[14px] text-[#6b6b6b]">
            {query
              ? `No loaded visitors match "${query}".`
              : 'No visits in this window.'}
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
              {filtered.map((row) => (
                <tr key={row.user_id} className="border-t border-[#2a2a2a]">
                  <td className="px-4 py-2.5 text-white">
                    {row.nickname ?? (
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
                    <BanButton
                        userId={row.user_id}
                        bannedUntil={row.bannedUntil}
                        nickname={row.nickname}
                        />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {query && filtered.length > 0 && (
        <p className="mt-2 text-center text-[12px] text-[#6b6b6b]">
          Showing {filtered.length} of {rows.length} loaded
        </p>
      )}
    </div>
  )
}