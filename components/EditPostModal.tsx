'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { resolveEmoji } from '@/lib/avatar'

const MAX_LENGTH = 280
const WINDOW_MS = 5 * 60 * 1000

export function EditPostModal({
  postId,
  createdAt,
  initialContent,
  open,
  onClose,
  onSaved,
}: {
  postId: string
  createdAt: string
  initialContent: string
  open: boolean
  onClose: () => void
  onSaved: (updated: { content: string; edited_at: string | null }) => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minutesLeft, setMinutesLeft] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [emoji] = useState(() => resolveEmoji())

  // Reset each time the modal opens
  useEffect(() => {
    if (!open) return
    setContent(initialContent)
    setError(null)
    const left = new Date(createdAt).getTime() + WINDOW_MS - Date.now()
    setMinutesLeft(Math.max(0, Math.ceil(left / 60000)))
    setTimeout(() => {
      const el = textareaRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      }
    }, 50)
  }, [open, initialContent, createdAt])

  // Escape closes
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Auto-grow
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [content, open])

  const trimmed = content.trim()
  const changed = trimmed !== initialContent.trim()
  const canSave = trimmed.length > 0 && trimmed.length <= MAX_LENGTH && changed && !saving
  const remaining = MAX_LENGTH - content.length

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)

    // .select() shows whether a row was really updated: when the 5-minute
    // policy blocks the update, Supabase returns no error, just zero rows.
    const { data, error } = await supabase
      .from('posts')
      .update({ content: trimmed })
      .eq('id', postId)
      .select('content, edited_at')

    if (error) {
      console.error('Edit failed:', error)
      setError(
        error.message.includes('guidelines')
          ? 'Your edit violates the community guidelines.'
          : 'Could not save your edit. Try again.'
      )
    } else if (!data || data.length === 0) {
      setError('The 5-minute edit window has passed.')
    } else {
      onSaved(data[0])
      onClose()
    }
    setSaving(false)
  }

  if (!open) return null

  return (
    <div
      onClick={(e) => {
        e.stopPropagation() // don't trigger the post card's click behind it
        onClose()
      }}
      className="fixed inset-0 z-[100] flex cursor-default items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-[#2a2a2a] bg-[#181818] text-white shadow-2xl sm:max-w-[560px] sm:rounded-3xl"
      >
        <div className="grid grid-cols-3 items-center px-5 py-3.5">
          <button
            onClick={onClose}
            className="justify-self-start text-[15px] text-white transition-opacity hover:opacity-70"
          >
            Cancel
          </button>
          <h2 className="text-center text-[15px] font-semibold">Edit post</h2>
          <span />
        </div>

        <div className="h-px bg-[#2a2a2a]" />

        <div className="flex gap-3 overflow-y-auto px-4 pb-3 pt-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-lg">
            {emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold">anon</div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={3}
              className="mt-0.5 max-h-[40vh] min-h-[72px] w-full resize-none bg-transparent text-[16px] leading-snug text-white outline-none placeholder:text-[#6b6b6b]"
            />
            {error && <p className="mt-2 text-[13px] text-[#ff4d6d]">{error}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <span className="text-[13px] text-[#777]">
            {minutesLeft > 0 ? `${minutesLeft} min left to edit` : 'Edit window ending'}
          </span>

          <div className="flex items-center gap-3">
            {remaining <= 20 && (
              <span className="text-[12px] tabular-nums text-[#ff4d6d]">{remaining}</span>
            )}
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`rounded-full px-5 py-2 text-[14px] font-semibold transition ${
                canSave ? 'bg-white text-black hover:bg-[#e6e6e6]' : 'bg-[#2e2e2e] text-[#777]'
              }`}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}