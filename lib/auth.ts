import { createClient } from '@/lib/supabase/client'

export async function ensureAnonymousSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session

  // Do NOT auto-create anonymous sessions on admin or login routes
  if (typeof window !== 'undefined') {
    const path = window.location.pathname
    if (path.startsWith('/admin') || path.startsWith('/login')) {
      return null
    }
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.error('Anonymous sign-in failed:', error.message)
    throw error
  }
  return data.session
}