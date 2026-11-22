'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Trash2, Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from './PostCard'
import type { Post } from '@/lib/feed'
import { resolveEmoji, emojiForAuthor } from '@/lib/avatar'

function timeAgo(dateStr?: string) {
  if (!dateStr) return 'now'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000))
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

type Reply = {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  avatar_emoji?: string | null
  nickname?: string | null
}

export function ThreadView({
  post,
  currentUserId,
  onReplyCountChange,
}: {
  post: Post
  currentUserId: string
  onReplyCountChange: (postId: string, count: number) => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const [replies, setReplies] = useState<Reply[]>([])
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [emoji] = useState(() => resolveEmoji())
  const postId = post.id

  useEffect(() => {
    let cancelled = false

    async function fetchReplies() {
      const { data, error } = await supabase
        .from('replies')
        .select('*, profiles:author_id ( nickname )')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      if (error) {
        console.error('Fetch replies failed:', error)
        return
      }
      if (!cancelled && data) {
        setReplies(
          data.map((r: any) => ({
            ...r,
            nickname: r.profiles?.nickname ?? null,
          }))
        )
      }
    }
    fetchReplies()

    const channel = supabase
      .channel(`replies-${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'replies', filter: `post_id=eq.${postId}` },
        async (payload) => {
          const raw = payload.new as any
          const { data: prof } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', raw.author_id)
            .maybeSingle()
          const incoming: Reply = { ...raw, nickname: prof?.nickname ?? null }
          setReplies((prev) =>
            prev.some((r) => r.id === incoming.id) ? prev : [...prev, incoming]
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'replies' },
        (payload) => {
          setReplies((prev) => prev.filter((r) => r.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  async function syncCount() {
    const { data, error } = await supabase
      .from('posts')
      .select('reply_count')
      .eq('id', postId)
      .maybeSingle()
    if (error) console.error('Count sync failed:', error)
    if (data) onReplyCountChange(postId, data.reply_count)
  }

  async function submitReply() {
    if (!content.trim() || sending) return
    setSending(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You need a session to reply. Refresh the page and try again.')
      setSending(false)
      return
    }

    const { data, error } = await supabase
      .from('replies')
      .insert({
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
        avatar_emoji: emoji,
      })
      .select()
      .single()

    if (error || !data) {
      const msg = error?.message ?? ''
      if (msg.includes('Rate limit exceeded')) {
        setError('Slow down — you can reply again in about a minute.')
      } else if (msg.includes('guidelines')) {
        setError('That content is blocked by the community guidelines.')
      } else {
        setError('Could not send your reply. Try again.')
      }
      setSending(false)
      return
    }

    setContent('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const { data: prof } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('user_id', user.id)
      .maybeSingle()

    const withName: Reply = { ...(data as any), nickname: prof?.nickname ?? null }
    setReplies((prev) =>
      prev.some((r) => r.id === withName.id) ? prev : [...prev, withName]
    )
    await syncCount()
    setSending(false)
  }

  async function handleDeleteReply(replyId: string) {
    if (!confirm('Delete this reply?')) return
    setError(null)

    const previous = replies
    setReplies((prev) => prev.filter((r) => r.id !== replyId))

    const { data, error } = await supabase
      .from('replies')
      .delete()
      .eq('id', replyId)
      .select('id')

    if (error || !data || data.length === 0) {
      console.error('Delete reply failed:', error ?? 'no rows deleted (check RLS policy)')
      setReplies(previous)
      setError('Could not delete that reply.')
      return
    }

    await syncCount()
  }

  async function handleReportReply(replyId: string) {
    if (!currentUserId) return
    const reason = prompt('Why are you reporting this reply?')
    if (!reason || !reason.trim()) return

    const { error } = await supabase.from('reports').insert({
      reply_id: replyId,
      reporter_id: currentUserId,
      reason: reason.trim(),
    })

    if (error) {
      console.error('Report failed:', error)
      alert('Could not submit the report. Try again.')
    } else {
      alert('Report submitted. Thank you.')
    }
  }

  const canReply = content.trim().length > 0 && !sending

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PostCard post={post} currentUserId={currentUserId} onOpenComments={() => {}} />

        <div className="h-px bg-[#2a2a2a]" />

        <div className="px-5 pb-1 pt-4 text-[14px] font-semibold text-[#9a9a9a]">Replies</div>

        <div className="px-5 pb-3">
          {replies.map((reply) => {
            const isReplyAuthor = reply.author_id === currentUserId
            const displayName = reply.nickname ?? 'anon'
            return (
              <div
                key={reply.id}
                className="group flex gap-3 border-b border-[#2a2a2a] py-4 last:border-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-base">
                  {reply.avatar_emoji ?? (isReplyAuthor ? emoji : emojiForAuthor(reply.author_id))}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold">{displayName}</span>
                      {isReplyAuthor && (
                        <span className="rounded-full bg-[#2a2a2a] px-1.5 py-0.5 text-[10px] font-medium text-[#9a9a9a]">
                          you
                        </span>
                      )}
                      <span className="text-[13px] text-[#6b6b6b]">{timeAgo(reply.created_at)}</span>
                    </div>

                    {isReplyAuthor ? (
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        aria-label="Delete reply"
                        className="text-[#6b6b6b] transition-colors hover:text-[#ff4d6d] sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReportReply(reply.id)}
                        aria-label="Report reply"
                        className="text-[#6b6b6b] transition-colors hover:text-[#ff4d6d] sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Flag size={15} />
                      </button>
                    )}
                  </div>

                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-snug text-[#f3f3f3]">
                    {reply.content}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-[#2a2a2a]" />

      <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {error && <p className="mb-2 px-1 text-[13px] text-[#ff4d6d]">{error}</p>}

        <div className="flex items-end gap-3">
          <div className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-base">
            {emoji}
          </div>

          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Reply to thread…"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-2xl bg-[#222] px-4 py-2.5 text-[14px] text-white outline-none placeholder:text-[#6b6b6b]"
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = `${t.scrollHeight}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitReply()
              }
            }}
          />

          <button
            onClick={submitReply}
            disabled={!canReply}
            className={`mb-0.5 rounded-full px-5 py-2 text-[14px] font-semibold transition ${
              canReply ? 'bg-white text-black hover:bg-[#e6e6e6]' : 'bg-[#2a2a2a] text-[#6b6b6b]'
            }`}
          >
            {sending ? 'Posting…' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  )
}