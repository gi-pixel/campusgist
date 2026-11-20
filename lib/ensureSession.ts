import { createClient } from '@/lib/supabase/client'

// One shared promise, so parallel callers never create two anonymous users
let pending: Promise<string> | null = null

function recordVisit(supabase: ReturnType<typeof createClient>) {
  // Fire-and-forget. Tracking must never block the UI.
  void (async () => {
    try {
      const { error } = await supabase.rpc('touch_visit')
      if (error) console.warn('touch_visit failed:', error.message)
    } catch (err) {
      console.warn('touch_visit threw:', err)
    }
  })()
}

export function ensureSession(): Promise<string> {
  if (!pending) {
    pending = (async () => {
      const supabase = createClient()

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        recordVisit(supabase)
        return session.user.id
      }

      const { data, error } = await supabase.auth.signInAnonymously()
      if (error || !data.user) {
        pending = null // allow a retry later
        throw error ?? new Error('Could not create a session')
      }

      recordVisit(supabase)
      return data.user.id
    })()
  }
  return pending
}