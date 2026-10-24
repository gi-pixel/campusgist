'use client'

import { useEffect, useState } from 'react'
import { ensureSession } from '@/lib/ensureSession'
import { isOnboarded, ONBOARDED_EVENT } from '@/lib/onboarding'

export function useCurrentUserId() {
  const [userId, setUserId] = useState('')

  useEffect(() => {
    let cancelled = false

    const start = () => {
      ensureSession()
        .then((id) => {
          if (!cancelled) setUserId(id)
        })
        .catch((err) => console.error('Session failed:', err))
    }

    if (isOnboarded()) start()
    else window.addEventListener(ONBOARDED_EVENT, start, { once: true })

    return () => {
      cancelled = true
      window.removeEventListener(ONBOARDED_EVENT, start)
    }
  }, [])

  return userId
}