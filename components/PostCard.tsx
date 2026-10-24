'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { HeartIcon, CommentIcon, SendIcon, MoreIcon } from './icons'
import { Trash2, Link as LinkIcon, Flag, Check, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resolveEmoji } from '@/lib/avatar'
import type { Post } from '@/lib/feed'
import { ImageCarousel } from './ImageCarousel'
import { EditPostModal } from './EditPostModal'

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
  const supabase = useMemo(() => createClient(), [])
  const [emoji] = useState(() => resolveEmoji())
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [content, setContent] = useState(post.content)
  const [editedAt, setEditedAt] = useState<string | null>(post.edited_at ?? null)
  const [editing, setEditing] = useState(false)

  const [likes, setLikes] = useState(post.like_count || 0)
  const [isLiked, setIsLiked] = useState(false)
  const [loadingLike, setLoadingLike] = useState(false)

  // Stay in sync with realtime updates pushed down from the feed
  useEffect(() => {
    setContent(post.content)
    setEditedAt(post.edited_at ?? null)
  }, [post.content, post.edited_at])

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
  const canEdit = isAuthor && Date.now() - new Date(post.created_at).getTime() < 5 * 60 * 1000

  // Handle both old (single) and new (array) images
  const displayImages = post.images?.length
    ? post.images
    : post.image_url
      ? [post.image_url]
      : []

  const menuItem =
    'flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-[#262626]'

  return (
    <article
      onClick={() => onOpenComments(post)}
      className="cursor-pointer px-4 py-3 transition-colors hover:bg-white/[0.02]"
    >
      <div className="flex gap-2.5">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-lg">
          {emoji}
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-semibold text-white">anon</span>
              <span className="text-[13px] text-[#6b6b6b]">{timeAgo(post.created_at)}</span>
              {editedAt && <span className="text-[13px] text-[#6b6b6b]">· edited</span>}
            </div>

            {/* Menu */}
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                aria-label="More options"
                className="-mr-1 flex h-7 w-7 items-center justify-center rounded-full text-[#6b6b6b] transition-colors hover:bg-[#222] hover:text-white"
              >
                <MoreIcon className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-50 w-48 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] shadow-2xl">
                  <button
                    onClick={(e) => {
                      handleShare(e)
                      setShowMenu(false)
                    }}
                    className={`${menuItem} text-white`}
                  >
                    Copy link <LinkIcon size={15} />
                  </button>

                  <div className="h-px bg-[#2a2a2a]" />

                  {isAuthor ? (
                    <>
                      {canEdit && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditing(true)
                              setShowMenu(false)
                            }}
                            className={`${menuItem} text-white`}
                          >
                            Edit <Pencil size={15} />
                          </button>
                          <div className="h-px bg-[#2a2a2a]" />
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete()
                          setShowMenu(false)
                        }}
                        className={`${menuItem} text-[#ff4d6d]`}
                      >
                        Delete <Trash2 size={15} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReport()
                        setShowMenu(false)
                      }}
                      className={`${menuItem} text-[#ff4d6d]`}
                    >
                      Report <Flag size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-[1.4] text-[#f3f3f3]">
            {content}
          </p>

          {/* Images */}
          {displayImages.length > 0 && <ImageCarousel images={displayImages} />}

          {/* Actions */}
          <div className="-ml-2 mt-1 flex items-center text-[#f3f3f3]">
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
              <HeartIcon filled={isLiked} className="h-[18px] w-[18px]" />
              {likes > 0 && <span className="text-[12px]">{likes}</span>}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenComments(post)
              }}
              aria-label="Reply"
              className="flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors hover:bg-[#222]"
            >
              <CommentIcon className="h-[18px] w-[18px]" />
              {post.reply_count > 0 && <span className="text-[12px]">{post.reply_count}</span>}
            </button>

            <button
              onClick={handleShare}
              aria-label="Copy link"
              className="flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors hover:bg-[#222]"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-[#4ade80]" />
                  <span className="text-[12px] text-[#4ade80]">Copied</span>
                </>
              ) : (
                <SendIcon className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>
      </div>

      <EditPostModal
        postId={post.id}
        createdAt={post.created_at}
        initialContent={content}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={(u) => {
          setContent(u.content)
          setEditedAt(u.edited_at)
        }}
      />
    </article>
  )
}