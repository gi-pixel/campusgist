'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export async function deletePostAdmin(postId: string) {
  const { supabase, user } = await requireAdmin()

  // 1. Snapshot the post for the audit log
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    throw new Error('Post not found or already deleted')
  }

  // 2. Log the deletion in the audit table
  const { error: auditError } = await supabase
    .from('deleted_posts_audit')
    .insert({
      post_id: postId,
      post_snapshot: post,
      deleted_by: user.id,
      reason: 'Admin dashboard removal',
    })

  // If the audit log fails, we should probably stop to avoid untracked deletions
  if (auditError) {
    console.error('Audit log failed:', auditError)
    throw new Error('Failed to log deletion to audit table')
  }

  // 3. Hard delete the post
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  // 4. Revalidate all paths where this post might be visible
  revalidatePath('/admin')
  revalidatePath('/admin/reports')
  revalidatePath('/')
}

export async function deleteReplyAdmin(replyId: string, reason?: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.rpc('admin_delete_reply', {
    p_id: replyId,
    p_reason: reason ?? undefined,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/admin/reports')
  revalidatePath('/')
}