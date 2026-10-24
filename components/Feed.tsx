'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchPosts, type Post } from '@/lib/feed'
import { PostCard } from './PostCard'
import { ThreadModal } from './ThreadModal'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUserId } from '@/lib/useCurrentUserId'

export function Feed({ refreshKey }: { refreshKey: number }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const userId = useCurrentUserId()

  // Which post is open in the comments modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)


  // 2. Load posts with pagination
  const load = useCallback(
    async (reset = false) => {
      if (loading) return
      setLoading(true)
      try {
        const { posts: newPosts, nextCursor } = await fetchPosts({
          cursor: reset ? null : cursor,
        })
        setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]))
        setCursor(nextCursor)
        setHasMore(Boolean(nextCursor))
      } catch (err) {
        console.error('Feed load failed:', err)
      } finally {
        setLoading(false)
        setInitialLoaded(true)
      }
    },
    [cursor, loading]
  )

    // Load when refreshKey changes (e.g. after posting), once the user session exists
    useEffect(() => {
    if (!userId) return
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey, userId])

  // 3. Realtime subscriptions
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('feed-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const incoming = payload.new as Post
          // Skip if the post is already in the list (e.g. your own post
          // arriving through both the refresh and the realtime event)
          setPosts((prev) =>
            prev.some((p) => p.id === incoming.id) ? prev : [incoming, ...prev]
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prev) => prev.filter((p) => p.id !== payload.old.id))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === payload.new.id
                ? {
                    ...p,
                    reply_count: payload.new.reply_count,
                    like_count: payload.new.like_count,
                  }
                : p
            )
          )

          setSelectedPost((current) => {
            if (current && current.id === payload.new.id) {
              return {
                ...current,
                reply_count: payload.new.reply_count,
                like_count: payload.new.like_count,
              }
            }
            return current
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 4. Instantly bump reply count when the user comments
// Sets the real count from the database (never +1/-1, so it can't drift)
    function handleReplyCountChange(postId: string, count: number) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reply_count: count } : p)))
    setSelectedPost((cur) => (cur && cur.id === postId ? { ...cur, reply_count: count } : cur))
    }

  // Waiting on the user ID or the first page: show skeletons instead of a blank screen
  if (!userId || !initialLoaded) {
    return <FeedSkeleton />
  }

  return (
    <div>
      {/* Empty state */}
      {posts.length === 0 && !loading && (
        <div className="flex flex-col items-center px-6 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#222] text-2xl">
            💬
          </div>
          <p className="text-[16px] font-semibold text-white">Nothing here yet</p>
          <p className="mt-1 text-[14px] text-[#6b6b6b]">
            Start the conversation.
          </p>
        </div>
      )}

      {/* Posts, separated by thin dividers like Threads */}
      <div className="divide-y divide-[#2a2a2a]">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            currentUserId={userId}
            onOpenComments={(post) => setSelectedPost(post)}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && posts.length > 0 && (
        <div className="border-t border-[#2a2a2a] px-4 py-6 text-center">
          <button
            onClick={() => load(false)}
            disabled={loading}
            className="rounded-full border border-[#2a2a2a] px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#222] disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <p className="border-t border-[#2a2a2a] py-8 text-center text-[13px] text-[#6b6b6b]">
          You&apos;re all caught up
        </p>
      )}

      {/* Thread modal */}
    <ThreadModal
    post={selectedPost}
    onClose={() => setSelectedPost(null)}
    onReplyCountChange={handleReplyCountChange}
    />
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="divide-y divide-[#2a2a2a]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse gap-3 px-4 py-4 md:px-5">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#262626]" />
          <div className="flex-1 space-y-2.5 pt-1">
            <div className="h-3 w-28 rounded bg-[#262626]" />
            <div className="h-3 w-full rounded bg-[#222]" />
            <div className="h-3 w-4/5 rounded bg-[#222]" />
            <div className="flex gap-4 pt-2">
              <div className="h-4 w-4 rounded bg-[#222]" />
              <div className="h-4 w-4 rounded bg-[#222]" />
              <div className="h-4 w-4 rounded bg-[#222]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}