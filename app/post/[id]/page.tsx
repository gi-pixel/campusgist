'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThreadView } from '@/components/ThreadView'
import { useCurrentUserId } from '@/lib/useCurrentUserId'
import type { Post } from '@/lib/feed'

type Status = 'loading' | 'ready' | 'missing'

export default function PostPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = useMemo(() => createClient(), [])
  const currentUserId = useCurrentUserId()
  const [post, setPost] = useState<Post | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (cancelled) return
      // An invalid id format also errors, so treat that as "not found" too
      if (error || !data) {
        setStatus('missing')
        return
      }
      setPost(data as Post)
      setStatus('ready')
    }
    load()

    // Live like/reply counts, and handle the post being deleted
    const channel = supabase
      .channel(`post-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts', filter: `id=eq.${id}` },
        (payload) =>
          setPost((prev) =>
            prev
              ? { ...prev, like_count: payload.new.like_count, reply_count: payload.new.reply_count }
              : prev
          )
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.old.id === id) setStatus('missing')
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [id, supabase])

  return (
    <div className="min-h-[100dvh] bg-[#101010] text-white">
      <div className="mx-auto flex h-[100dvh] w-full max-w-[640px] flex-col bg-[#181818] md:border-x md:border-[#2a2a2a]">
        {/* Header */}
        <div className="grid grid-cols-3 items-center px-5 py-4">
          <Link
            href="/"
            aria-label="Back to feed"
            className="justify-self-start text-[#9a9a9a] transition-colors hover:text-white"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-center text-[16px] font-bold">Thread</h1>
          <span />
        </div>
        <div className="h-px bg-[#2a2a2a]" />

        {status === 'loading' && (
          <div className="flex animate-pulse gap-3 px-5 py-5" aria-hidden>
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#262626]" />
            <div className="flex-1 space-y-2.5 pt-1">
              <div className="h-3 w-28 rounded bg-[#262626]" />
              <div className="h-3 w-full rounded bg-[#222]" />
              <div className="h-3 w-4/5 rounded bg-[#222]" />
            </div>
          </div>
        )}

        {status === 'missing' && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-[17px] font-semibold">This post isn&apos;t available</p>
            <p className="mt-1 text-[14px] text-[#6b6b6b]">It may have been deleted, or the link is wrong.</p>
            <Link
              href="/"
              className="mt-5 rounded-full bg-white px-5 py-2 text-[14px] font-semibold text-black transition hover:bg-[#e6e6e6]"
            >
              Go to feed
            </Link>
          </div>
        )}

        {status === 'ready' && post && (
          <ThreadView
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onReplyCountChange={(_, count) =>
              setPost((p) => (p ? { ...p, reply_count: count } : p))
            }
          />
        )}
      </div>
    </div>
  )
}