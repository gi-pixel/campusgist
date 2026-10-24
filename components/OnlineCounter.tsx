'use client'

import { useSyncExternalStore } from 'react'
import { getOnlineCount, subscribeOnline } from '@/lib/onlinePresence'

export function OnlineCounter() {
  const count = useSyncExternalStore(subscribeOnline, getOnlineCount, () => 0)

  return (
    <span className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      {count > 0 ? `${count} online` : 'online'}
    </span>
  )
}