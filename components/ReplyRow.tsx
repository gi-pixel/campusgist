'use client'

import { useState } from 'react'
import { Trash2, Flag, Reply as ReplyIcon, ChevronDown, ChevronRight } from 'lucide-react'
import type { ReplyNode as ReplyNodeType } from '@/lib/replies'
import { countDescendants } from '@/lib/replies'

function timeAgo(dateStr?: string) {
  if (!dateStr) return 'now'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000))
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

const MAX_INDENT_DEPTH = 3
const INDENT_PX = 24

export function ReplyRow({
  reply,
  currentUserId,
  myEmoji,
  onDelete,
  onReport,
  onReply,
}: {
  reply: ReplyNodeType
  currentUserId: string
  myEmoji: string
  onDelete: (id: string) => void
  onReport: (id: string) => void
  onReply: (parentId: string, parentNickname: string) => void
}) {
  // Direct children expanded by default; deeper levels collapsed
  const [expanded, setExpanded] = useState(reply.depth < 1)
  const isMine = reply.author_id === currentUserId
  const displayName = reply.nickname ?? 'anon'
  const avatar = reply.avatar_emoji ?? (isMine ? myEmoji : '🥷')

  // Show the parent's nickname as context when we're flattening past max depth
  const flattened = reply.depth > MAX_INDENT_DEPTH
  const indent = Math.min(reply.depth, MAX_INDENT_DEPTH) * INDENT_PX
  const childCount = countDescendants(reply)
  const directChildCount = reply.children.length

  return (
    <div style={{ marginLeft: indent }}>
      <div className="group flex gap-3 border-b border-[#2a2a2a] py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-sm">
          {avatar}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-white">{displayName}</span>
              {isMine && (
                <span className="rounded-full bg-[#2a2a2a] px-1.5 py-0.5 text-[10px] font-medium text-[#9a9a9a]">
                  you
                </span>
              )}
              {flattened && (
                <span className="text-[11px] text-[#6b6b6b]">
                  replying in thread
                </span>
              )}
              <span className="text-[12px] text-[#6b6b6b]">
                {timeAgo(reply.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100">
              <button
                onClick={() => onReply(reply.id, displayName)}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-[#6b6b6b] transition-colors hover:bg-[#222] hover:text-white"
              >
                <ReplyIcon size={11} />
                Reply
              </button>
              {isMine ? (
                <button
                  onClick={() => onDelete(reply.id)}
                  aria-label="Delete reply"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#6b6b6b] transition-colors hover:bg-[#222] hover:text-[#ff4d6d]"
                >
                  <Trash2 size={13} />
                </button>
              ) : (
                <button
                  onClick={() => onReport(reply.id)}
                  aria-label="Report reply"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#6b6b6b] transition-colors hover:bg-[#222] hover:text-[#ff4d6d]"
                >
                  <Flag size={13} />
                </button>
              )}
            </div>
          </div>

          <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-snug text-[#f3f3f3]">
            {reply.content}
          </p>

          {/* Toggle children */}
          {directChildCount > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 flex items-center gap-1 text-[12px] font-medium text-[#1d9bf0] transition-colors hover:text-[#4bb1f5]"
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {expanded
                ? `Hide ${childCount} ${childCount === 1 ? 'reply' : 'replies'}`
                : `View ${childCount} ${childCount === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>
      </div>

      {expanded && reply.children.length > 0 && (
        <div className="border-l border-[#2a2a2a]">
          {reply.children.map((child) => (
            <ReplyRow
              key={child.id}
              reply={child}
              currentUserId={currentUserId}
              myEmoji={myEmoji}
              onDelete={onDelete}
              onReport={onReport}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}