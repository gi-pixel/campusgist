'use client'

import { useState } from 'react'
import { Ban } from 'lucide-react'
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

  // Custom duration state
  const [customOpen, setCustomOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState('1')
  const [customUnit, setCustomUnit] = useState<'hours' | 'days' | 'weeks' | 'months'>('days')

  const isPermanentlyBanned = bannedUntil === 'infinity'
  const isBanned =
    isPermanentlyBanned ||
    (bannedUntil != null && new Date(bannedUntil) > new Date())

  function toDays(amount: number, unit: typeof customUnit): number {
    switch (unit) {
      case 'hours':
        return Math.max(1, Math.round(amount / 24))
      case 'days':
        return Math.max(1, Math.round(amount))
      case 'weeks':
        return Math.max(1, Math.round(amount * 7))
      case 'months':
        return Math.max(1, Math.round(amount * 30))
    }
  }

  async function handleBan(days: number | null) {
    setBusy(true)
    setError(null)
    const res = await banUserAdmin(userId, days)
    if (!res.ok) {
      setError(res.error)
      setBusy(false)
      return
    }
    setSuccess(true)
    setOpen(false)
    setCustomOpen(false)
    setTimeout(() => setSuccess(false), 1500)
    setBusy(false)
  }

  async function handleCustomBan() {
    const amount = Number(customAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a positive number')
      return
    }
    const days = toDays(amount, customUnit)
    await handleBan(days)
  }

  async function handleUnban() {
    setBusy(true)
    setError(null)
    const res = await unbanUserAdmin(userId)
    if (!res.ok) {
      setError(res.error)
    } else {
      setSuccess(true)
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
        {busy ? '…' : success ? 'Unbanned' : 'Unban'}
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
        <Ban size={12} />
        Ban
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setCustomOpen(false) }} />
          <div className="absolute right-0 top-8 z-20 w-56 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] shadow-2xl">
            {!customOpen ? (
              <>
                {[
                  { label: '1 hour', days: 1, hint: '1h' },
                  { label: '1 day', days: 1 },
                  { label: '7 days', days: 7 },
                  { label: '30 days', days: 30 },
                  { label: 'Permanent', days: null as number | null },
                ].map(({ label, days, hint }) => (
                  <button
                    key={label}
                    onClick={() => handleBan(days)}
                    disabled={busy}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] font-medium text-white transition hover:bg-[#262626] disabled:opacity-50"
                  >
                    {label}
                    {hint && <span className="text-[10px] text-[#6b6b6b]">{hint}</span>}
                  </button>
                ))}
                <button
                  onClick={() => setCustomOpen(true)}
                  className="flex w-full items-center border-t border-[#2a2a2a] px-3 py-2 text-left text-[12px] font-medium text-[#1d9bf0] transition hover:bg-[#262626]"
                >
                  Custom…
                </button>
              </>
            ) : (
              <div className="p-3">
                <p className="mb-2 text-[11px] text-[#9a9a9a]">Ban duration</p>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min={1}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-16 rounded-lg bg-[#222] px-2 py-1.5 text-[12px] text-white outline-none focus:bg-[#2a2a2a]"
                  />
                  <select
                    value={customUnit}
                    onChange={(e) =>
                      setCustomUnit(e.target.value as 'hours' | 'days' | 'weeks' | 'months')
                    }
                    className="flex-1 rounded-lg bg-[#222] px-2 py-1.5 text-[12px] text-white outline-none focus:bg-[#2a2a2a]"
                  >
                    <option value="hours">hours</option>
                    <option value="days">days</option>
                    <option value="weeks">weeks</option>
                    <option value="months">months</option>
                  </select>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => { setCustomOpen(false); setError(null) }}
                    disabled={busy}
                    className="flex-1 rounded-lg border border-[#2a2a2a] px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#2a2a2a] disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCustomBan}
                    disabled={busy}
                    className="flex-1 rounded-lg bg-[#ff3040] px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#e02a39] disabled:opacity-50"
                  >
                    {busy ? '…' : 'Ban'}
                  </button>
                </div>
              </div>
            )}
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