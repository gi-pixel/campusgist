'use client'

import { useState } from 'react'
import { NICKNAME_RE, changeMyNickname } from '@/lib/nickname'



export function ChangeNicknameModal({
  open,
  currentNickname,
  onClose,
}: {
  open: boolean
  currentNickname: string
  onClose: () => void
}) {
  const [value, setValue] = useState(currentNickname)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid =
    value.trim() !== currentNickname &&
    /^[A-Za-z][A-Za-z0-9_]{1,19}$/.test(value.trim())

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await changeMyNickname(value.trim())
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Could not change nickname')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#181818] p-5"
      >
        <h2 className="text-[16px] font-semibold text-white">Change nickname</h2>
        <p className="mt-1 text-[12px] text-[#9a9a9a]">
          Your past posts will show the new name.
        </p>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="mt-4 w-full rounded-xl bg-[#222] px-4 py-2.5 text-[15px] text-white outline-none"
        />
        {error && <p className="mt-2 text-[12px] text-[#ff4d6d]">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-[#2a2a2a] py-2 text-[13px] font-semibold text-white hover:bg-[#222] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid || busy}
            className="flex-1 rounded-xl bg-white py-2 text-[13px] font-semibold text-black hover:bg-[#e6e6e6] disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}