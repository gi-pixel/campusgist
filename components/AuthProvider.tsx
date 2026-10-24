'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ensureAnonymousSession } from '@/lib/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    async function bootstrap() {
      try {
        await ensureAnonymousSession()
      } catch (err) {
        console.error('Auth bootstrap failed:', err)
      } finally {
        if (mounted) setReady(true)
      }
    }

    bootstrap()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Session already handled by bootstrap or Supabase
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (!ready) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#000',
        color: '#71767b',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
      }}>
        Loading…
      </div>
    )
  }

  return <>{children}</>
}