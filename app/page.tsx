'use client'

import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { Feed } from '@/components/Feed'
import { ComposerModal } from '@/components/ComposerModal'

export default function Page() {
  const [composerOpen, setComposerOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <AppShell active="home" onCompose={() => setComposerOpen(true)}>
      {/* Inline composer row */}
      <div className="flex items-center gap-3 border-b border-[#2a2a2a] px-4 py-3 md:px-6">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[#2a2a2a]" />
        <button
          onClick={() => setComposerOpen(true)}
          className="min-w-0 flex-1 truncate text-left text-[15px] text-[#6b6b6b]"
        >
          What&apos;s new?
        </button>
        <button
          onClick={() => setComposerOpen(true)}
          className="shrink-0 rounded-full border border-[#2a2a2a] px-4 py-1.5 text-[14px] font-semibold text-white transition hover:bg-[#222]"
        >
          Post
        </button>
      </div>

      <Feed refreshKey={refreshKey} />

      <ComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={() => setRefreshKey((k) => k + 1)}
      />
    </AppShell>
  )
}