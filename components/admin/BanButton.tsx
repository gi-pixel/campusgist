'use client'

import { useState } from 'react'
import { Ban, Check } from 'lucide-react'
import { banUserAdmin, unbanUserAdmin } from '@/app/admin/actions'

export function BanButton({
  userId,
  bannedUntil,
}: {
  userId: string
  bannedUntil: string | null
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isBanned = bannedUntil && new Date(bannedUntil) > new Date()

  async function handleBan(days: number | null) {
    setBusy(true)
    setError(null)
    const res = await banUserAdmin(userId, days)
    if (!res.ok) setError(res.error)
    else {
      setSuccess(true)
      setOpen(false)
      setTimeout(() => setSuccess(false), 1500)
    }
    setBusy(false)
  }

  async function handleUnban() {
    setBusy(true)
    setError(null)
    const res = await unbanUserAdmin(userId)
    if (!res.ok) setError(res.error)
    else {
      setSuccess(true)
      setOpen(false)
      setTimeout(() => setSuccess(false), 1500)
    }
    setBusy(false)
  }

  if (isBanned) {
    return (
      <button
        onClick={handleUnban}
        disabled={busy}
        className="rounded-full border border-[#2a2a2a] px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-[#222] disabled:opacity-50"
      >
        {busy ? '…' : 'Unban'}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="flex items-center gap-1 rounded-full border border-[#2a2a2a] px-3 py-1 text-[12px] font-semibold text-[#ff4d6d] transition hover:bg-[#222] disabled:opacity-50"
      >
        {success ? <Check size={12} /> : <Ban size={12} />}
        {success ? 'Done' : 'Ban'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] shadow-2xl">
            {[
              { label: '7 days', days: 7 },
              { label: '30 days', days: 30 },
              { label: 'Permanent', days: null },
            ].map(({ label, days }) => (
              <button
                key={label}
                onClick={() => handleBan(days)}
                disabled={busy}
                className="flex w-full items-center px-3 py-2 text-left text-[12px] font-medium text-white transition hover:bg-[#262626] disabled:opacity-50"
              >
                {label}
              </button>
            ))}
            {error && (
              <p className="border-t border-[#2a2a2a] px-3 py-2 text-[11px] text-[#ff4d6d]">
                {error}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}