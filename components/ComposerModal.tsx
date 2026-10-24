'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { createPost } from '@/lib/posts'
import { resolveEmoji } from '@/lib/avatar'
import type { Database } from '@/lib/supabase/types'

type PostCategory = Database['public']['Enums']['post_category']

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'campus', label: 'Campus' },
  { value: 'confessions', label: 'Confessions' },
  { value: 'studies', label: 'Studies' },
  { value: 'entertainment', label: 'Entertainment' },
]

const MAX_LENGTH = 280

export function ComposerModal({
  open,
  onClose,
  onPosted,
}: {
  open: boolean
  onClose: () => void
  onPosted: () => void
}) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory>('general')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emoji = resolveEmoji()

  // Create preview URLs once per file set and clean them up
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url))
  }, [previews])

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50)
    } else {
      setContent('')
      setFiles([])
      setCategory('general')
      setError(null)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [content, open])

  const canPost = content.trim().length > 0 && content.length <= MAX_LENGTH && !submitting
  const remaining = MAX_LENGTH - content.length

  async function handleSubmit() {
    if (!canPost) return
    setSubmitting(true)
    setError(null)
    try {
      await createPost({ content: content.trim(), category, imageFiles: files })
      onPosted()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || [])
    if (picked.length) setFiles((prev) => [...prev, ...picked])
    e.target.value = '' // lets the same file be picked again
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-[#2a2a2a] bg-[#181818] shadow-2xl sm:max-w-[560px] sm:rounded-3xl"
      >
        {/* Header */}
        <div className="grid grid-cols-3 items-center px-5 py-4">
          <button
            onClick={onClose}
            className="justify-self-start text-[15px] text-white transition-opacity hover:opacity-70"
          >
            Cancel
          </button>
          <h2 className="text-center text-[16px] font-bold">New post</h2>
          <span />
        </div>

        <div className="h-px bg-[#2a2a2a]" />

        {/* Body */}
        <div className="flex gap-3 overflow-y-auto px-5 pb-2 pt-4">
          {/* Avatar column with thread line */}
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-xl">
              {emoji}
            </div>
            <div className="mt-2 w-0.5 flex-1 rounded-full bg-[#2a2a2a]" />
          </div>

          <div className="min-w-0 flex-1 pb-2">
            <div className="text-[15px] font-semibold">Anonymous</div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's new?"
              maxLength={MAX_LENGTH}
              rows={2}
              className="mt-0.5 max-h-[40vh] min-h-[56px] w-full resize-none bg-transparent text-[15px] leading-snug text-white outline-none placeholder:text-[#6b6b6b]"
            />

            {/* Image previews */}
            {previews.length > 0 && (
              <div
                className="mt-3 flex gap-2 overflow-x-auto"
                style={{ scrollbarWidth: 'none' }}
              >
                {previews.map((src, i) => (
                  <div key={src} className="relative shrink-0">
                    <img
                      src={src}
                      alt=""
                      className="h-40 w-auto max-w-[260px] rounded-xl border border-[#2a2a2a] object-cover"
                    />
                    <button
                      onClick={() => removeFile(i)}
                      aria-label="Remove image"
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Attach */}
            <div className="mt-3 flex items-center gap-4 text-[#6b6b6b]">
              <label className="cursor-pointer transition-colors hover:text-white" title="Add images">
                <ImagePlus size={20} strokeWidth={1.7} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFiles}
                  className="hidden"
                />
              </label>
            </div>

            {error && <div className="mt-3 text-[13px] text-[#ff4d6d]">{error}</div>}
          </div>
        </div>

        {/* Category pills */}
        <div className="px-5 pb-3 pt-1">
          <div
            className="flex gap-2 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {CATEGORIES.map((c) => {
              const active = c.value === category
              return (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    active
                      ? 'border-white bg-white text-black'
                      : 'border-[#2a2a2a] text-[#9a9a9a] hover:border-[#444] hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="h-px bg-[#2a2a2a]" />

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <span className="text-[13px] text-[#6b6b6b]">Anyone on campus can reply</span>

          <div className="flex items-center gap-3">
            {content.length > 0 && (
              <span
                className={`text-[13px] tabular-nums ${
                  remaining <= 20 ? 'text-[#ff4d6d]' : 'text-[#6b6b6b]'
                }`}
              >
                {remaining}
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!canPost}
              className={`rounded-full px-5 py-2 text-[14px] font-semibold transition ${
                canPost
                  ? 'bg-white text-black hover:bg-[#e6e6e6]'
                  : 'bg-[#2a2a2a] text-[#6b6b6b]'
              }`}
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}