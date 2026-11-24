'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from './PostCard'
import { ReplyRow } from './ReplyRow'
import type { Post } from '@/lib/feed'
import { resolveEmoji } from '@/lib/avatar'
import { buildReplyTree, type RawReply } from '@/lib/replies'
import { X } from 'lucide-react'

export function ThreadView({
  post,
  currentUserId,
}: {
  post: Post
  currentUserId: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [rawReplies, setRawReplies] = useState<RawReply[]>([])
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const repliesRef = useRef<RawReply[]>([])
  const [emoji] = useState(() => resolveEmoji())
  const myNickname = useRef<string | null>(null)
  const postId = post.id

  // The reply currently being replied to (for nested reply mode)
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null)

  useEffect(() => {
    repliesRef.current = rawReplies
  }, [rawReplies])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('user_id', user.id)
        .maybeSingle()
      myNickname.current = data?.nickname ?? null
    })
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    async function fetchReplies() {
      const { data, error } = await supabase
        .from('replies')
        .select('*, profiles:author_id ( nickname )')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      if (error || cancelled || !data) return

      const fetched: RawReply[] = data.map((r: any) => ({
        ...r,
        nickname: r.profiles?.nickname ?? null,
      }))
      setRawReplies((prev) => {
        const byId = new Map<string, RawReply>()
        for (const r of fetched) byId.set(r.id, r)
        for (const r of prev) if (!byId.has(r.id)) byId.set(r.id, r)
        return [...byId.values()].sort(
          (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
        )
      })
    }

    const channel = supabase
      .channel(`replies-${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'replies', filter: `post_id=eq.${postId}` },
        (payload) => {
          const raw = payload.new as any
          if (repliesRef.current.some((r) => r.id === raw.id)) return
          const incoming: RawReply = { ...raw, nickname: null }
          setRawReplies((prev) =>
            prev.some((r) => r.id === incoming.id) ? prev : [...prev, incoming]
          )
          if (raw.author_id) {
            supabase
              .from('profiles')
              .select('nickname')
              .eq('user_id', raw.author_id)
              .maybeSingle()
              .then(({ data: prof }) => {
                if (prof?.nickname) {
                  setRawReplies((prev) =>
                    prev.map((r) =>
                      r.id === incoming.id && !r.nickname
                        ? { ...r, nickname: prof.nickname }
                        : r
                    )
                  )
                }
              })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'replies' },
        (payload) => {
          setRawReplies((prev) => prev.filter((r) => r.id !== payload.old.id))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchReplies()
      })

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  const tree = useMemo(() => buildReplyTree(rawReplies), [rawReplies])

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
        parent_id: replyTo?.id ?? null,
      })
      .select()
      .single()

    if (error || !data) {
      const msg = error?.message ?? ''
      if (msg.includes('Rate limit exceeded')) {
        setError('Slow down — you can reply again in about a minute.')
      } else if (msg.includes('guidelines')) {
        setError('That content is blocked by the community guidelines.')
      } else if (msg.toLowerCase().includes('row-level security')) {
        setError('You are currently banned from replying.')
      } else {
        setError('Could not send your reply. Try again.')
      }
      setSending(false)
      return
    }

    setContent('')
    setReplyTo(null)
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const mine: RawReply = { ...(data as any), nickname: myNickname.current }
    setRawReplies((prev) =>
      prev.some((r) => r.id === mine.id) ? prev : [...prev, mine]
    )
    setSending(false)
  }

  async function handleDeleteReply(replyId: string) {
    if (!confirm('Delete this reply? Nested replies will also be removed.')) return
    setError(null)

    const previous = repliesRef.current
    setRawReplies((prev) => prev.filter((r) => r.id !== replyId))

    const { data, error } = await supabase
      .from('replies')
      .delete()
      .eq('id', replyId)
      .select('id')

    if (error || !data || data.length === 0) {
      console.error('Delete reply failed:', error ?? 'no rows deleted')
      setRawReplies(previous)
      setError('Could not delete that reply.')
    }
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

  function handleReplyTo(parentId: string, parentNickname: string) {
    setReplyTo({ id: parentId, nickname: parentNickname })
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const canReply = content.trim().length > 0 && !sending
  const totalReplies = rawReplies.length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PostCard post={post} currentUserId={currentUserId} onOpenComments={() => {}} />

        <div className="h-px bg-[#2a2a2a]" />

        <div className="px-5 pb-1 pt-4 text-[14px] font-semibold text-[#9a9a9a]">
          {totalReplies > 0
            ? `${totalReplies} ${totalReplies === 1 ? 'Reply' : 'Replies'}`
            : 'Replies'}
        </div>

        <div className="pb-3">
          {tree.length === 0 ? (
            <p className="px-5 py-6 text-center text-[13px] text-[#6b6b6b]">
              No replies yet. Start the conversation.
            </p>
          ) : (
            <div className="px-3">
              {tree.map((node) => (
                <ReplyRow
                  key={node.id}
                  reply={node}
                  currentUserId={currentUserId}
                  myEmoji={emoji}
                  onDelete={handleDeleteReply}
                  onReport={handleReportReply}
                  onReply={handleReplyTo}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-[#2a2a2a]" />

      {/* Reply bar */}
      <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Replying-to indicator */}
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-[#222] px-3 py-1.5 text-[12px] text-[#9a9a9a]">
            <span>
              Replying to <span className="font-semibold text-white">{replyTo.nickname}</span>
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-[#6b6b6b] transition-colors hover:text-white"
              aria-label="Cancel reply"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {error && <p className="mb-2 px-1 text-[13px] text-[#ff4d6d]">{error}</p>}

        <div className="flex items-end gap-3">
          <div className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-base">
            {emoji}
          </div>

          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? `Reply to ${replyTo.nickname}…` : 'Reply to thread…'}
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
              if (e.key === 'Escape' && replyTo) {
                setReplyTo(null)
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