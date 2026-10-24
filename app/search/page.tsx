'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchPosts, searchPosts, type Post } from '@/lib/feed'
import { PostCard } from '@/components/PostCard'
import { ThreadModal } from '@/components/ThreadModal'
import { SearchIcon } from '@/components/icons'
import { useCurrentUserId } from '@/lib/useCurrentUserId'

export default function SearchPage() {
  const supabase = useMemo(() => createClient(), [])
  const currentUserId = useCurrentUserId()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [serverResults, setServerResults] = useState<Post[] | null>(null)
  const [searchingAll, setSearchingAll] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  // Load recent posts once; everything after this filters in the browser
  useEffect(() => {
    fetchPosts({ limit: 200 })
      .then(({ posts }) => setPosts(posts))
      .catch((err) => console.error('Search load failed:', err))
      .finally(() => setLoading(false))
  }, [])

  // A new query clears the "older posts" results
  useEffect(() => {
    setServerResults(null)
  }, [query])

  // Remove posts that get deleted while you're on this page
  useEffect(() => {
    const channel = supabase
      .channel('search-deletes')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        setPosts((prev) => prev.filter((p) => p.id !== payload.old.id))
        setServerResults((prev) => (prev ? prev.filter((p) => p.id !== payload.old.id) : prev))
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const terms = q.split(/\s+/)
    const local = posts.filter((p) => {
      const text = `${p.content} ${p.category ?? ''}`.toLowerCase()
      return terms.every((t) => text.includes(t))
    })
    if (!serverResults) return local
    const seen = new Set(local.map((p) => p.id))
    return [...local, ...serverResults.filter((p) => !seen.has(p.id))].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    )
  }, [posts, query, serverResults])

  async function searchOlder() {
    setSearchingAll(true)
    try {
      setServerResults(await searchPosts(query))
    } catch (err) {
      console.error('Server search failed:', err)
    } finally {
      setSearchingAll(false)
    }
  }

  function handleReplyCountChange(postId: string, count: number) {
    const patch = (list: Post[]) =>
      list.map((p) => (p.id === postId ? { ...p, reply_count: count } : p))
    setPosts(patch)
    setServerResults((prev) => (prev ? patch(prev) : prev))
    setSelectedPost((cur) => (cur && cur.id === postId ? { ...cur, reply_count: count } : cur))
  }

  const hasQuery = query.trim().length > 0

  return (
    <div className="min-h-[100dvh] bg-[#101010] text-white">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[640px] bg-[#181818] md:border-x md:border-[#2a2a2a]">
        {/* Sticky search bar */}
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#2a2a2a] bg-[#181818]/95 px-4 py-3 backdrop-blur-md">
          <Link
            href="/"
            aria-label="Back to feed"
            className="text-[#9a9a9a] transition-colors hover:text-white"
          >
            <ChevronLeft size={24} />
          </Link>

          <div className="flex flex-1 items-center gap-2 rounded-full bg-[#222] px-4 py-2.5">
            <SearchIcon className="h-5 w-5 shrink-0 text-[#6b6b6b]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-[#6b6b6b]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="text-[#6b6b6b] transition-colors hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* States */}
        {loading && (
          <p className="px-6 py-16 text-center text-[14px] text-[#6b6b6b]">Loading posts…</p>
        )}

        {!loading && !hasQuery && (
          <div className="px-6 py-20 text-center">
            <p className="text-[16px] font-semibold">Search the feed</p>
            <p className="mt-1 text-[14px] text-[#6b6b6b]">
              Type a word to find matching posts.
            </p>
          </div>
        )}

        {!loading && hasQuery && results.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-[16px] font-semibold">No matches</p>
            <p className="mt-1 text-[14px] text-[#6b6b6b]">
              Nothing in the latest {posts.length} posts matches &ldquo;{query.trim()}&rdquo;.
            </p>
          </div>
        )}

        {/* Results */}
        {hasQuery && results.length > 0 && (
          <>
            <p className="px-5 py-3 text-[13px] text-[#6b6b6b]">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
            <div className="divide-y divide-[#2a2a2a] border-t border-[#2a2a2a]">
              {results.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  currentUserId={currentUserId}
                  onOpenComments={(post) => setSelectedPost(post)}
                />
              ))}
            </div>
          </>
        )}

        {/* Older posts */}
        {!loading && hasQuery && serverResults === null && (
          <div className="border-t border-[#2a2a2a] px-4 py-6 text-center">
            <button
              onClick={searchOlder}
              disabled={searchingAll}
              className="rounded-full border border-[#2a2a2a] px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#222] disabled:opacity-50"
            >
              {searchingAll ? 'Searching…' : 'Search older posts'}
            </button>
          </div>
        )}
      </div>

      <ThreadModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onReplyCountChange={handleReplyCountChange}
      />
    </div>
  )
}