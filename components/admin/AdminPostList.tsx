'use client'

import { useState } from 'react'
import { Trash2, Heart, MessageCircle } from 'lucide-react'
import { deletePostAdmin } from '@/app/admin/actions'
import type { Post } from '@/lib/feed'

export function AdminPostList({
  initialPosts,
  emptyText = 'No posts found.',
}: {
  initialPosts: Post[]
  emptyText?: string
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(id: string) {
    setBusyId(id)
    setError(null)
    try {
      await deletePostAdmin(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      setError(err.message || 'Could not delete the post')
    }
    setBusyId(null)
    setConfirmId(null)
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-10 text-center text-[14px] text-[#6b6b6b]">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-[#4a1d27] bg-[#2a1218] px-4 py-3 text-[13px] text-[#ff8a9b]">
          {error}
        </div>
      )}

      {posts.map((post) => {
        const images = post.images?.length ? post.images : post.image_url ? [post.image_url] : []
        const confirming = confirmId === post.id
        const busy = busyId === post.id

        return (
          <div
            key={post.id}
            className="flex flex-col gap-3 rounded-2xl border border-[#2a2a2a] bg-[#181818] p-4 md:flex-row md:items-start md:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[#6b6b6b]">
                <span className="rounded-full bg-[#2a2a2a] px-2.5 py-0.5 font-medium capitalize text-white">
                  {post.category}
                </span>
                <span suppressHydrationWarning>
                  {new Date(post.created_at).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                {post.edited_at && <span>· edited</span>}
                <span>· by {post.author_id.slice(0, 8)}</span>
              </div>

              <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-[14px] leading-snug text-[#f3f3f3]">
                {post.content}
              </p>

              {images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {images.slice(0, 4).map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-16 w-16 rounded-lg border border-[#2a2a2a] object-cover"
                    />
                  ))}
                  {images.length > 4 && (
                    <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#222] text-[12px] text-[#9a9a9a]">
                      +{images.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-center gap-4 text-[12px] text-[#6b6b6b]">
                <span className="flex items-center gap-1.5">
                  <Heart size={14} /> {post.like_count}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle size={14} /> {post.reply_count}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 md:pl-4">
              {confirming ? (
                <>
                  <button
                    onClick={() => setConfirmId(null)}
                    disabled={busy}
                    className="rounded-full border border-[#2a2a2a] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#222] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => remove(post.id)}
                    disabled={busy}
                    className="rounded-full bg-[#ff3040] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#e02a39] disabled:opacity-50"
                  >
                    {busy ? 'Deleting…' : 'Confirm delete'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmId(post.id)}
                  className="flex items-center gap-1.5 rounded-full border border-[#2a2a2a] px-4 py-1.5 text-[13px] font-semibold text-[#ff4d6d] transition hover:bg-[#222]"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}