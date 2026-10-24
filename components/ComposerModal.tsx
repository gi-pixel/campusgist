'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ImagePlus, X, ChevronRight, Check, SlidersHorizontal } from 'lucide-react'
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
  const [topicChosen, setTopicChosen] = useState(false)
  const [topicOpen, setTopicOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vp, setVp] = useState<{ top: number; height: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [emoji] = useState(() => resolveEmoji())

  // Preview URLs: created once per file set, revoked on cleanup
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url))
  }, [previews])

  // Reset on close, focus on open
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50)
    } else {
      setContent('')
      setFiles([])
      setCategory('general')
      setTopicChosen(false)
      setTopicOpen(false)
      setError(null)
    }
  }, [open])

  // Escape closes + lock background scroll
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Phones: fit the sheet to the area above the keyboard
  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    const mobile = window.matchMedia('(max-width: 639px)').matches
    if (!vv || !mobile) return

    const update = () => setVp({ top: vv.offsetTop, height: vv.height })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      setVp(null)
    }
  }, [open])

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [content, open])

  const canPost = content.trim().length > 0 && content.length <= MAX_LENGTH && !submitting
  const remaining = MAX_LENGTH - content.length
  const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label ?? 'General'

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
    e.target.value = ''
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-x-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      style={vp ? { top: vp.top, height: vp.height } : { top: 0, height: '100%' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[94%] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#181818] shadow-2xl sm:h-auto sm:max-h-[85vh] sm:max-w-[560px] sm:rounded-3xl sm:border sm:border-[#2a2a2a]"
      >
        {/* Header */}
        <div className="grid grid-cols-3 items-center px-5 py-3.5">
          <button
            onClick={onClose}
            className="justify-self-start text-[15px] text-white transition-opacity hover:opacity-70"
          >
            Cancel
          </button>
          <h2 className="text-center text-[15px] font-semibold">New post</h2>
          <span />
        </div>

        <div className="h-px bg-[#2a2a2a]" />

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex gap-3 px-4 pb-4 pt-3.5">
            {/* Avatar + thread line */}
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-lg">
                {emoji}
              </div>
              <div className="mt-2 w-[2px] flex-1 rounded-full bg-[#2e2e2e]" />
            </div>

            <div className="min-w-0 flex-1">
              {/* Name + topic chip */}
              <div className="relative flex items-center gap-1 text-[14px]">
                <span className="font-semibold text-white">anon</span>
                <button
                  onClick={() => setTopicOpen((v) => !v)}
                  className="flex items-center gap-0.5 text-[#6b6b6b] transition-colors hover:text-white"
                >
                  <ChevronRight size={14} />
                  <span className={topicChosen ? 'text-white' : ''}>
                    {topicChosen ? categoryLabel : 'Add a topic'}
                  </span>
                </button>

                {topicOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setTopicOpen(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1.5 w-48 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] shadow-2xl">
                      {CATEGORIES.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => {
                            setCategory(c.value)
                            setTopicChosen(true)
                            setTopicOpen(false)
                          }}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#262626]"
                        >
                          {c.label}
                          {topicChosen && c.value === category && <Check size={15} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Text */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's new?"
                maxLength={MAX_LENGTH}
                rows={2}
                className="mt-0.5 min-h-[56px] w-full resize-none bg-transparent text-[16px] leading-snug text-white outline-none placeholder:text-[#6b6b6b]"
              />

              {/* Image previews */}
              {previews.length > 0 && (
                <div
                  className="mt-2 flex gap-2 overflow-x-auto"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {previews.map((src, i) => (
                    <div key={src} className="relative shrink-0">
                      <img
                        src={src}
                        alt=""
                        className="h-36 w-auto max-w-[220px] rounded-xl border border-[#2a2a2a] object-cover"
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
              <div className="mt-3 flex items-center gap-5 text-[#777]">
                <label className="cursor-pointer transition-colors hover:text-white" title="Add images">
                  <ImagePlus size={22} strokeWidth={1.6} />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFiles}
                    className="hidden"
                  />
                </label>
              </div>

              {error && <p className="mt-3 text-[13px] text-[#ff4d6d]">{error}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="flex items-center gap-2 text-[13px] text-[#777]">
            <SlidersHorizontal size={17} strokeWidth={1.7} />
            <span>Anyone can reply</span>
          </div>

          <div className="flex items-center gap-3">
            {content.length > 0 && (
              <span
                className={`text-[12px] tabular-nums ${
                  remaining <= 20 ? 'text-[#ff4d6d]' : 'text-[#777]'
                }`}
              >
                {remaining}
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!canPost}
              className={`rounded-full px-5 py-2 text-[14px] font-semibold transition ${
                canPost ? 'bg-white text-black hover:bg-[#e6e6e6]' : 'bg-[#2e2e2e] text-[#777]'
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