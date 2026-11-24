'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fetchNotifications, markAllRead, type Notification } from '@/lib/notifications'
import { NotificationRow } from './NotificationRow'

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Initial fetch
  useEffect(() => {
    let cancelled = false
    fetchNotifications()
      .then((list) => {
        if (!cancelled) {
          setNotifications(list)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Fetch notifications failed:', err)
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Mark all read after a short visible delay
  useEffect(() => {
    if (loading || notifications.length === 0) return
    const t = setTimeout(async () => {
      try {
        await markAllRead()
        setNotifications((prev) =>
          prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }))
        )
        router.refresh()
      } catch (err) {
        console.error('Failed to mark notifications read:', err)
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [loading, notifications.length, router])

  // Realtime updates
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        async () => {
          try {
            const fresh = await fetchNotifications()
            setNotifications(fresh)
          } catch (err) {
            console.warn('Realtime notification refresh failed:', err)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-3 p-4" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex animate-pulse gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-[#262626]" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-32 rounded bg-[#262626]" />
              <div className="h-3 w-full rounded bg-[#222]" />
              <div className="h-3 w-3/4 rounded bg-[#222]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#222] text-2xl">
          🔔
        </div>
        <p className="text-[16px] font-semibold text-white">No notifications yet</p>
        <p className="mt-1 max-w-[260px] text-[14px] text-[#6b6b6b]">
          When someone replies to your posts, you'll see it here.
        </p>
      </div>
    )
  }

  return (
    <div>
      {notifications.map((n) => (
        <NotificationRow key={n.id} notification={n} />
      ))}
    </div>
  )
}