import { createClient } from '@/lib/supabase/client'

// One shared promise, so parallel callers never create two anonymous users
let pending: Promise<string> | null = null

export function ensureSession(): Promise<string> {
  if (!pending) {
    pending = (async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) return session.user.id

      const { data, error } = await supabase.auth.signInAnonymously()
      if (error || !data.user) {
        pending = null // allow a retry later
        throw error ?? new Error('Could not create a session')
      }
      return data.user.id
    })()
  }
  return pending
}