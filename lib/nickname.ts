import { createClient } from '@/lib/supabase/client'

export const NICKNAME_RE = /^[A-Za-z][A-Za-z0-9_]{1,19}$/

export async function nicknameAvailable(nickname: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('nickname_available', {
    p_nickname: nickname,
  })
  if (error) throw error
  return data === true
}

export async function setNickname(nickname: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('set_nickname', { p_nickname: nickname })
  if (error) throw new Error(error.message)
}

export async function changeMyNickname(nickname: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('change_my_nickname', {
    p_new_nickname: nickname,
  })
  if (error) throw new Error(error.message)
}

export async function adminResetNickname(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('admin_reset_nickname', {
    p_user_id: userId,
  })
  if (error) throw new Error(error.message)
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('admin_delete_user', {
    p_user_id: userId,
  })
  if (error) throw new Error(error.message)
}

export async function needsNickname(): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('needs_nickname')
  if (error) throw error
  return data === true
}