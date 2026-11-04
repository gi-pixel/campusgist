import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type Post = Database['public']['Tables']['posts']['Row'] & {
  images?: string[] | null
  image_url?: string | null
  avatar_emoji?: string | null
  is_admin?: boolean
}

export async function fetchPosts(params: {
  category?: string | null
  cursor?: string | null
  limit?: number
}): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const supabase = createClient()
  const limit = params.limit ?? 20

  let query = supabase
    .from('posts')
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
    .from('posts')
    .select('*')
    .ilike('content', `%${query.trim()}%`)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Supabase search error:', JSON.stringify(error, null, 2))
    throw new Error(error.message || 'Search failed')
  }

  return (data || []).map((post) => ({
    ...post,
    is_admin: false, // Search results won't show admin badge — fine for now
  }))
}