import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function roleFromToken(token: string): string | undefined {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).user_role
  } catch {
    return undefined
  }
}

export async function requireAdmin() {
  const supabase = await createClient()

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // If no user OR the user is anonymous, kick to login
  if (!user || user.is_anonymous) {
    redirect('/login')
  }

  // 2. Check the JWT for the admin claim
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || roleFromToken(session.access_token) !== 'admin') {
    redirect('/login')
  }

  return { supabase, user }
}