'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { ThreadView } from './ThreadView'
import { useCurrentUserId } from '@/lib/useCurrentUserId'
import type { Post } from '@/lib/feed'

export function ThreadModal({
  post,
  onClose,
  onReplyCountChange,
}: {
  post: Post | null
  onClose: () => void
  onReplyCountChange: (postId: string, count: number) => void
}) {
  const currentUserId = useCurrentUserId()

  // Escape closes + lock background scroll
  useEffect(() => {
    if (!post) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [post, onClose])

  if (!post) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-[#2a2a2a] bg-[#181818] shadow-2xl sm:h-auto sm:max-h-[88vh] sm:max-w-[640px] sm:rounded-3xl"
      >
        <div className="grid grid-cols-3 items-center px-5 py-4">
          <button
            onClick={onClose}
            aria-label="Close"
            className="justify-self-start text-[#9a9a9a] transition-colors hover:text-white"
          >
            <X size={22} strokeWidth={1.8} />
          </button>
          <h2 className="text-center text-[16px] font-bold">Thread</h2>
          <span />
        </div>

        <div className="h-px bg-[#2a2a2a]" />

        <ThreadView
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onReplyCountChange={onReplyCountChange}
        />
      </div>
    </div>
  )
}