import { createClient } from '@/lib/supabase/client'

export type Notification = {
  id: string
  kind: 'reply'
  post_id: string
  reply_id: string
  actor_id: string
  read_at: string | null
  created_at: string
  // Enriched
  actor_nickname: string | null
  actor_emoji: string | null
  reply_content: string
  post_content: string
}

export async function fetchNotifications(limit = 50): Promise<Notification[]> {
  const supabase = createClient()

  const { data: rows, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  if (!rows || rows.length === 0) return []

  // Batch-fetch actor profiles, reply content, and post content
  const actorIds = [...new Set(rows.map((r) => r.actor_id))]
  const replyIds = [...new Set(rows.map((r) => r.reply_id))]
  const postIds = [...new Set(rows.map((r) => r.post_id))]

  const [profilesRes, repliesRes, postsRes] = await Promise.all([
    supabase.from('profiles').select('user_id, nickname, avatar_emoji').in('user_id', actorIds),
    supabase.from('replies').select('id, content').in('id', replyIds),
    supabase.from('posts').select('id, content').in('id', postIds),
  ])

  const profilesById = new Map(
    (profilesRes.data ?? []).map((p) => [
      p.user_id,
      { nickname: p.nickname as string | null, emoji: p.avatar_emoji as string | null },
    ])
  )
  const repliesById = new Map((repliesRes.data ?? []).map((r) => [r.id, r.content as string]))
  const postsById = new Map((postsRes.data ?? []).map((p) => [p.id, p.content as string]))

  return rows.map((r) => {
    const prof = profilesById.get(r.actor_id)
    return {
      ...(r as any),
      actor_nickname: prof?.nickname ?? null,
      actor_emoji: prof?.emoji ?? null,
      reply_content: repliesById.get(r.reply_id) ?? '[deleted]',
      post_content: postsById.get(r.post_id) ?? '[deleted]',
    } as Notification
  })
}

export async function markAllRead(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('mark_notifications_read')
  if (error) throw error
}

export async function unreadCount(): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('unread_notification_count')
  if (error) return 0
  return (data as number) ?? 0
}