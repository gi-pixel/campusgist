import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type Post = Database['public']['Tables']['posts']['Row'] & {
  images?: string[] | null
  image_url?: string | null
  avatar_emoji?: string | null
  author_nickname?: string | null
}

export async function fetchPosts(params: {
  category?: string | null
  cursor?: string | null
  limit?: number
}): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const supabase = createClient()
  const limit = params.limit ?? 20

  // Read from posts_with_author so author_nickname is included in the row.
  let query = supabase
    .from('posts_with_author')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }

  if (params.cursor) {
    query = query.lt('created_at', params.cursor)
  }

  const { data, error } = await query
  if (error) throw error

  const nextCursor =
    data && data.length === limit ? data[data.length - 1].created_at : null

  return { posts: (data as Post[]) ?? [], nextCursor }
}

export async function searchPosts(query: string): Promise<Post[]> {
  if (!query.trim()) return []

  const supabase = createClient()

  const { data, error } = await supabase
    .from('posts_with_author')
    .select('*')
    .ilike('content', `%${query.trim()}%`)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Supabase search error:', JSON.stringify(error, null, 2))
    throw new Error(error.message || 'Search failed')
  }

  return (data as Post[]) ?? []
}

// Attach nicknames to rows that didn't come from posts_with_author
// (e.g. realtime INSERT payloads, which only include raw posts columns).
export async function attachNicknames(posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return posts
  const supabase = createClient()
  const ids = [...new Set(posts.map((p) => p.author_id))]
  const { data } = await supabase
    .from('profiles')
    .select('user_id, nickname')
    .in('user_id', ids)
  const map = new Map((data ?? []).map((r) => [r.user_id, r.nickname]))
  return posts.map((p) => ({ ...p, author_nickname: map.get(p.author_id) ?? null }))
}