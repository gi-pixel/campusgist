'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnnouncementAdmin } from '../actions'
import type { Database } from '@/lib/supabase/types'

type PostCategory = Database['public']['Enums']['post_category']

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'campus', label: 'Campus' },
  { value: 'general', label: 'General' },
  { value: 'confessions', label: 'Confessions' },
  { value: 'studies', label: 'Studies' },
  { value: 'entertainment', label: 'Entertainment' },
]

export function AdminComposer() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory>('campus')
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const text = content.trim()
  const remaining = 280 - content.length

  async function publish() {
    setLoading(true)
    setError(null)

    const res = await createAnnouncementAdmin(text, category)
    if (!res.ok) {
      setError(res.error)
      setLoading(false)
      setConfirming(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4">
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setConfirming(false)
        }}
        placeholder="Write an official announcement…"
        rows={5}
        maxLength={280}
        className="w-full resize-none bg-transparent text-[16px] leading-snug text-white outline-none placeholder:text-[#6b6b6b]"
      />

      {/* Category pills */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              c.value === category
                ? 'border-white bg-white text-black'
                : 'border-[#2a2a2a] text-[#9a9a9a] hover:border-[#444] hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Live preview */}
      {text && (
        <div className="mt-4">
          <p className="mb-2 text-[12px] text-[#6b6b6b]">Preview</p>
          <div className="flex gap-2.5 rounded-2xl border border-[#2a2a2a] bg-[#101010] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-lg">
              📢
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-white">CampusGist</span>
                <span className="rounded-full bg-white px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-black">
                  Official
                </span>
                <span className="text-[13px] text-[#6b6b6b]">now</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.35] text-[#f3f3f3]">
                {text}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-[#ff4d6d]">{error}</p>}

      <div className="mt-4 flex items-center justify-between border-t border-[#2a2a2a] pt-4">
        <span
          className={`text-[12px] tabular-nums ${remaining <= 20 ? 'text-[#ff4d6d]' : 'text-[#6b6b6b]'}`}
        >
          {content.length}/280
        </span>

        <div className="flex items-center gap-2">
          {confirming ? (
            <>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="rounded-full border border-[#2a2a2a] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#222] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={publish}
                disabled={loading}
                className="rounded-full bg-white px-5 py-2 text-[14px] font-semibold text-black transition hover:bg-[#e6e6e6] disabled:opacity-50"
              >
                {loading ? 'Posting…' : 'Confirm and publish'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              disabled={!text}
              className="rounded-full bg-white px-5 py-2 text-[14px] font-semibold text-black transition hover:bg-[#e6e6e6] disabled:bg-[#2e2e2e] disabled:text-[#777]"
            >
              Review and post
            </button>
          )}
        </div>
      </div>
    </div>
  )
}