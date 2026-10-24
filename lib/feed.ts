import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export type Post = Database['public']['Tables']['posts']['Row'] & {
  images?: string[] | null
  image_url?: string | null 
   avatar_emoji?: string | null
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

  return { posts: data ?? [], nextCursor }
}

export async function searchPosts(term: string, limit = 50): Promise<Post[]> {
  const supabase = createClient()
  // Escape LIKE wildcards so "100%" or "a_b" are searched literally
  const safe = term.trim().replace(/[\\%_]/g, '\\$&')
  if (!safe) return []

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .ilike('content', `%${safe}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}