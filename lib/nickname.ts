import { createClient } from '@/lib/supabase/client'

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