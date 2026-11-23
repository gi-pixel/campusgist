'use client'

import { useState } from 'react'
import { MoreIcon } from '@/components/icons'
import { banUserAdmin, unbanUserAdmin } from '@/app/admin/actions'
import { adminResetNickname, adminDeleteUser } from '@/lib/nickname'

export function BanButton({
  userId,
  bannedUntil,
  nickname,
}: {
  userId: string
  bannedUntil: string | null
  nickname: string | null
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mode, setMode] = useState<'menu' | 'ban' | 'reset' | 'delete'>('menu')
  const [customAmount, setCustomAmount] = useState('1')
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks' | 'months'>('days')
  const [confirmText, setConfirmText] = useState('')

  const isPermanentlyBanned = bannedUntil === 'infinity'
  const isBanned =
    isPermanentlyBanned ||
    (bannedUntil != null && new Date(bannedUntil) > new Date())

  function toDays(amount: number, unit: typeof customUnit): number {
    switch (unit) {
      case 'days':
        return Math.max(1, Math.round(amount))
      case 'weeks':
        return Math.max(1, Math.round(amount * 7))
      case 'months':
        return Math.max(1, Math.round(amount * 30))
    }
  }

  function closeMenu() {
    setOpen(false)
    setMode('menu')
    setError(null)
    setConfirmText('')
  }

  async function runAction(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      closeMenu()
    } catch (err: any) {
      setError(err?.message ?? 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleBan(days: number | null) {
    await runAction(async () => {
      const res = await banUserAdmin(userId, days)
      if (!res.ok) throw new Error(res.error)
    })
  }

  async function handleCustomBan() {
    const amount = Number(customAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a positive number')
      return
    }
    await handleBan(toDays(amount, customUnit))
  }

  async function handleUnban() {
    await runAction(async () => {
      const res = await unbanUserAdmin(userId)
      if (!res.ok) throw new Error(res.error)
    })
  }

  async function handleReset() {
    await runAction(async () => {
      await adminResetNickname(userId)
    })
  }

  async function handleDelete() {
    if (!nickname || confirmText !== nickname) {
      setError(`Type "${nickname ?? ''}" to confirm`)
      return
    }
    await runAction(async () => {
      await adminDeleteUser(userId)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#6b6b6b] transition hover:bg-[#222] hover:text-white disabled:opacity-50"
        aria-label="User actions"
      >
        <MoreIcon className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={closeMenu} />
          <div className="absolute right-0 top-8 z-20 w-64 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] shadow-2xl">
            {mode === 'menu' && (
              <>
                {isBanned ? (
                  <button
                    onClick={handleUnban}
                    disabled={busy}
                    className="flex w-full items-center px-3 py-2 text-left text-[12px] font-medium text-white transition hover:bg-[#262626] disabled:opacity-50"
                  >
                    Unban user
                  </button>
                ) : (
                  <>
                    <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-wide text-[#6b6b6b]">
                      Ban
                    </p>
                    {[1, 7, 30].map((d) => (
                      <button
                        key={d}
                        onClick={() => handleBan(d)}
                        disabled={busy}
                        className="flex w-full items-center px-3 py-2 text-left text-[12px] font-medium text-white transition hover:bg-[#262626] disabled:opacity-50"
                      >
                        {d} {d === 1 ? 'day' : 'days'}
                      </button>
                    ))}
                    <button
                      onClick={() => setMode('ban')}
                      className="flex w-full items-center px-3 py-2 text-left text-[12px] font-medium text-[#1d9bf0] transition hover:bg-[#262626]"
                    >
                      Custom duration…
                    </button>
                    <button
                      onClick={() => handleBan(null)}
                      disabled={busy}
                      className="flex w-full items-center px-3 py-2 text-left text-[12px] font-medium text-[#ff4d6d] transition hover:bg-[#262626] disabled:opacity-50"
                    >
                      Ban permanently
                    </button>
                  </>
                )}

                <div className="my-1 h-px bg-[#2a2a2a]" />

                <button
                  onClick={() => setMode('reset')}
                  disabled={busy || !nickname}
                  className="flex w-full items-center px-3 py-2 text-left text-[12px] font-medium text-white transition hover:bg-[#262626] disabled:opacity-50"
                >
                  Reset nickname
                </button>

                <button
                  onClick={() => setMode('delete')}
                  className="flex w-full items-center px-3 py-2 text-left text-[12px] font-medium text-[#ff4d6d] transition hover:bg-[#262626]"
                >
                  Delete user…
                </button>
              </>
            )}

            {mode === 'ban' && (
              <div className="p-3">
                <p className="mb-2 text-[11px] text-[#9a9a9a]">Ban duration</p>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min={1}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-16 rounded-lg bg-[#222] px-2 py-1.5 text-[12px] text-white outline-none"
                  />
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value as any)}
                    className="flex-1 rounded-lg bg-[#222] px-2 py-1.5 text-[12px] text-white outline-none"
                  >
                    <option value="days">days</option>
                    <option value="weeks">weeks</option>
                    <option value="months">months</option>
                  </select>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => setMode('menu')}
                    disabled={busy}
                    className="flex-1 rounded-lg border border-[#2a2a2a] px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-[#2a2a2a] disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCustomBan}
                    disabled={busy}
                    className="flex-1 rounded-lg bg-[#ff3040] px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-[#e02a39] disabled:opacity-50"
                  >
                    {busy ? '…' : 'Ban'}
                  </button>
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div className="p-3">
                <p className="mb-2 text-[12px] text-white">
                  Reset {nickname}'s nickname?
                </p>
                <p className="mb-3 text-[11px] text-[#9a9a9a]">
                  They'll be asked to pick a new one on their next visit. Past posts will show
                  as "anon".
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setMode('menu')}
                    disabled={busy}
                    className="flex-1 rounded-lg border border-[#2a2a2a] px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-[#2a2a2a] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={busy}
                    className="flex-1 rounded-lg bg-[#ff3040] px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-[#e02a39] disabled:opacity-50"
                  >
                    {busy ? '…' : 'Reset'}
                  </button>
                </div>
              </div>
            )}

            {mode === 'delete' && (
              <div className="p-3">
                <p className="mb-2 text-[12px] font-semibold text-[#ff4d6d]">
                  Delete {nickname ?? 'this user'} permanently?
                </p>
                <p className="mb-2 text-[11px] text-[#9a9a9a]">
                  This deletes all their posts, replies, likes and reports. Cannot be undone.
                </p>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`Type "${nickname ?? ''}" to confirm`}
                  className="w-full rounded-lg bg-[#222] px-2 py-1.5 text-[11px] text-white outline-none placeholder:text-[#6b6b6b]"
                />
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => setMode('menu')}
                    disabled={busy}
                    className="flex-1 rounded-lg border border-[#2a2a2a] px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-[#2a2a2a] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={busy || !nickname || confirmText !== nickname}
                    className="flex-1 rounded-lg bg-[#ff3040] px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-[#e02a39] disabled:opacity-50"
                  >
                    {busy ? '…' : 'Delete'}
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