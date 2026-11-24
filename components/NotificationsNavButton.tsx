'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { unreadCount } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/client'

export function DesktopNotificationsButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  // Fetch count initially + when navigating back to /
  useEffect(() => {
    let cancelled = false
    unreadCount().then((n) => {
      if (!cancelled) setCount(n)
    })
    return () => {
      cancelled = true
    }
  }, [pathname])

  // Poll every 30s as a cheap fallback to realtime
  useEffect(() => {
    const id = setInterval(() => {
      unreadCount().then(setCount)
    }, 30000)
    return () => clearInterval(id)
  }, [])

  // Realtime on notifications
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('nav-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          unreadCount().then(setCount)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        () => {
          unreadCount().then(setCount)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <button
      onClick={() => router.push('/notifications')}
      aria-label="Notifications"
      title="Notifications"
      className="flex h-[52px] w-[76px] items-center justify-center rounded-xl text-[#4d4d4d] transition-colors hover:bg-[#1e1e1e] hover:text-[#b0b0b0]"
    >
      <span className="relative">
        <Bell size={26} />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1 min-w-[16px] rounded-full bg-[#ff3040] px-1 text-center text-[10px] font-bold leading-4 text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
    </button>
  )
}

export function MobileNotificationsButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    unreadCount().then((n) => {
      if (!cancelled) setCount(n)
    })
    return () => {
      cancelled = true
    }
  }, [pathname])

  useEffect(() => {
    const id = setInterval(() => {
      unreadCount().then(setCount)
    }, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('nav-notifications-mobile')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          unreadCount().then(setCount)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        () => {
          unreadCount().then(setCount)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <button
      onClick={() => router.push('/notifications')}
      aria-label="Notifications"
      className="relative justify-self-center"
    >
      <Bell size={22} className="text-[#4d4d4d]" />
      {count > 0 && (
        <span className="absolute -right-2 -top-1 min-w-[14px] rounded-full bg-[#ff3040] px-1 text-center text-[9px] font-bold leading-3.5 text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}