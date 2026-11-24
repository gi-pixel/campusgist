'use client'

import type { Notification } from '@/lib/notifications'

function timeAgo(dateStr: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000))
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function snippet(text: string, max: number) {
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length > max ? t.slice(0, max).trimEnd() + '…' : t
}

export function NotificationRow({
  notification,
  onSelect,
}: {
  notification: Notification
  onSelect: (notification: Notification) => void
}) {
  const unread = notification.read_at === null
  const actor = notification.actor_nickname ?? 'anon'
  const emoji = notification.actor_emoji ?? '🥷'
  const postPreview = notification.post?.content ?? '[deleted]'

  return (
    <button
      onClick={() => onSelect(notification)}
      className={`flex w-full gap-3 border-b border-[#2a2a2a] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02] ${
        unread ? 'bg-[#1d9bf0]/[0.04]' : ''
      }`}
    >
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-base">
        {emoji}
        {unread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#181818] bg-[#1d9bf0]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="font-semibold text-white">{actor}</span>
          <span className="text-[#6b6b6b]">
            {notification.kind === 'nested_reply'
              ? 'replied to your reply'
              : 'replied to your post'}
          </span>
          <span className="text-[#6b6b6b]">· {timeAgo(notification.created_at)}</span>
        </div>

        <p className="mt-1 whitespace-pre-wrap break-words text-[14px] leading-snug text-[#f3f3f3]">
          {snippet(notification.reply_content, 100)}
        </p>

        <div className="mt-2 rounded-lg border border-[#2a2a2a] bg-[#101010] px-3 py-1.5">
          <p className="text-[11px] text-[#6b6b6b]">Your post</p>
          <p className="mt-0.5 truncate text-[12px] text-[#9a9a9a]">
            {snippet(postPreview, 80)}
          </p>
        </div>
      </div>
    </button>
  )
}