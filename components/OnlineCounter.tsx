'use client'

import { useOnlineCount } from './useOnlineCount'

export function OnlineCounter() {
  const count = useOnlineCount()

  // Don't render anything while we are connecting or if no one is online
  if (count === 0) return <span className="text-[14px] text-[#71767b]">Connecting...</span>

  return (
    <div className="flex items-center gap-2 text-[14px] text-[#71767b]">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <span>
        <strong className="text-white">{count}</strong> online now
      </span>
    </div>
  )
}