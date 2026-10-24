'use client'

import { useState, useEffect, useRef } from 'react'
import { HeartIcon, CommentIcon, SendIcon, MoreIcon } from './icons'
import { Trash2, Link as LinkIcon, Flag, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resolveEmoji } from '@/lib/avatar'
import type { Post } from '@/lib/feed'
import { ImageCarousel } from './ImageCarousel'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function PostCard({
  post,
  currentUserId,
  onOpenComments,
}: {
  post: Post
  currentUserId: string
  onOpenComments: (post: Post) => void
}) {
  const supabase = createClient()
  const [emoji] = useState(() => resolveEmoji())
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [likes, setLikes] = useState(post.like_count || 0)
  const [isLiked, setIsLiked] = useState(false)
  const [loadingLike, setLoadingLike] = useState(false)

  // Keep the count in sync when realtime updates arrive from the Feed
  useEffect(() => {
    setLikes(post.like_count || 0)
  }, [post.like_count])

  useEffect(() => {
    async function checkLike() {
      if (!currentUserId) return
      const { data } = await supabase
        .from('likes')
        .select('post_id')
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
        .maybeSingle()
      if (data) setIsLiked(true)
    }
    checkLike()
  }, [post.id, currentUserId, supabase])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function toggleLike() {
    if (loadingLike) return
    setLoadingLike(true)
    const prevLikes = likes
    const prevIsLiked = isLiked
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)

    try {
    const { error } = isLiked
        ? await supabase.from('likes').delete().match({ post_id: post.id, user_id: currentUserId })
        : await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId })
    if (error) throw error
    } catch (err) {
    console.error('Like failed:', err)
    setIsLiked(prevIsLiked)
    setLikes(prevLikes)
    } finally {
    setLoadingLike(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', post.id)
  }

  async function handleReport() {
    const reason = prompt('Why are you reporting this post?')
    if (!reason || !reason.trim()) return

    try {
      const { error } = await supabase.from('reports').insert({
        post_id: post.id,
        reporter_id: currentUserId,
        reason: reason.trim(),
      })
      if (error) throw error
      alert('Report submitted. Thank you.')
    } catch (err: any) {
      alert('Failed to submit report: ' + err.message)
    }
  }

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation()
    const url = `${window.location.origin}/post/${post.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const isAuthor = post.author_id === currentUserId

  // Handle both old (single) and new (array) images
  const displayImages = post.images?.length
    ? post.images
    : post.image_url
      ? [post.image_url]
      : []

  return (
    <article
      onClick={() => onOpenComments(post)}
      className="cursor-pointer px-4 py-4 transition-colors hover:bg-white/[0.02] md:px-5"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-xl">
          {emoji}
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-white">anon</span>
              <span className="text-[14px] text-[#6b6b6b]">{timeAgo(post.created_at)}</span>
            </div>

            {/* Menu */}
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                aria-label="More options"
                className="-mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-[#6b6b6b] transition-colors hover:bg-[#222] hover:text-white"
              >
                <MoreIcon className="h-5 w-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-9 z-50 w-52 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] shadow-2xl">
                  <button
                    onClick={(e) => {
                      handleShare(e)
                      setShowMenu(false)
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#262626]"
                  >
                    Copy link <LinkIcon size={16} />
                  </button>

                  <div className="h-px bg-[#2a2a2a]" />

                  {isAuthor ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete()
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-[14px] font-medium text-[#ff4d6d] transition-colors hover:bg-[#262626]"
                    >
                      Delete <Trash2 size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReport()
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-[14px] font-medium text-[#ff4d6d] transition-colors hover:bg-[#262626]"
                    >
                      Report <Flag size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-snug text-[#f3f3f3]">
            {post.content}
          </p>

          {/* Images */}
          {displayImages.length > 0 && <ImageCarousel images={displayImages} />}

          {/* Actions */}
          <div className="-ml-2 mt-2 flex items-center gap-1 text-[#f3f3f3]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleLike()
              }}
              aria-label="Like"
              className={`flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors hover:bg-[#222] ${
                isLiked ? 'text-[#ff3040]' : ''
              }`}
            >
              <HeartIcon filled={isLiked} />
              {likes > 0 && <span className="text-[13px]">{likes}</span>}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenComments(post)
              }}
              aria-label="Reply"
              className="flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors hover:bg-[#222]"
            >
              <CommentIcon />
              {post.reply_count > 0 && <span className="text-[13px]">{post.reply_count}</span>}
            </button>

            <button
              onClick={handleShare}
              aria-label="Copy link"
              className="flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors hover:bg-[#222]"
            >
              {copied ? (
                <>
                  <Check size={18} className="text-[#4ade80]" />
                  <span className="text-[13px] text-[#4ade80]">Copied</span>
                </>
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}