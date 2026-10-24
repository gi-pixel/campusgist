'use client'

import { useState } from 'react'
import { Feed } from '@/components/Feed'
import { ComposerModal } from '@/components/ComposerModal'
import { OnlineCounter } from '@/components/OnlineCounter'
import {
  HomeIcon,
  SearchIcon,
  ComposeIcon,
  HeartIcon,
  UserIcon,
  ThreadsLogo,
} from '@/components/icons'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  const [composerOpen, setComposerOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
     

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      {/* Top bar (desktop): logo | nav | status */}
      <header className="fixed inset-x-0 top-0 z-40 hidden h-[76px] grid-cols-3 items-center px-6 md:grid">
        <div className="text-white">
          <ThreadsLogo className="h-9 w-9" />
        </div>

        <nav className="flex items-center justify-center gap-1">
          <NavButton label="Home" active>
            <HomeIcon filled className="h-[26px] w-[26px]" />
          </NavButton>
          <NavButton label="Search" onClick={() => router.push('/search')}>
            <SearchIcon className="h-[26px] w-[26px]" />
          </NavButton>
          <NavButton label="New post" onClick={() => setComposerOpen(true)} pill>
            <ComposeIcon className="h-[22px] w-[22px]" />
          </NavButton>
          <NavButton label="Activity">
            <HeartIcon className="h-[26px] w-[26px]" />
          </NavButton>
          <NavButton label="Profile">
            <UserIcon className="h-[26px] w-[26px]" />
          </NavButton>
        </nav>

        <div className="flex justify-end">
          <div className="flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#181818] px-3 py-1.5 text-[13px] text-[#9a9a9a]">
            <OnlineCounter />
          </div>
        </div>
      </header>

      {/* Top bar (mobile): centered logo */}
      <header className="sticky top-0 z-40 flex justify-center bg-[#101010]/90 py-3 backdrop-blur-md md:hidden">
        <ThreadsLogo className="h-8 w-8 text-white" />
      </header>

    {/* Feed card: full width on mobile, progressively wider on desktop */}
      <main className="mx-auto w-full min-w-0 pb-24 md:max-w-[640px] md:pb-0 md:pt-[76px]">
        <div className="min-h-screen min-w-0 overflow-x-hidden border-[#2a2a2a] bg-[#181818] md:rounded-t-[28px] md:border md:border-b-0">
        {/* Card header */}
        <div className="flex items-center justify-center border-b border-[#2a2a2a] py-4">
          <h2 className="text-[15px] font-semibold">For you</h2>
        </div>

        {/* Inline composer row */}
        <div className="flex items-center gap-3 border-b border-[#2a2a2a] px-4 py-4 md:px-6">
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
      </div>
    </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around bg-[#101010]/95 pb-6 pt-3 backdrop-blur-md md:hidden">
        <HomeIcon filled className="h-6 w-6 text-white" />
        <button onClick={() => router.push('/search')} aria-label="Search">
          <SearchIcon className="h-6 w-6 text-[#71767b]" />
        </button>
        <button onClick={() => setComposerOpen(true)} className="rounded-xl bg-[#1e1e1e] px-4 py-2 text-[#9a9a9a]">
          <ComposeIcon className="h-5 w-5" />
        </button>
        <HeartIcon className="h-6 w-6 text-[#4d4d4d]" />
        <UserIcon className="h-6 w-6 text-[#4d4d4d]" />
      </nav>

      <ComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}

function NavButton({
  children,
  label,
  active,
  pill,
  onClick,
}: {
  children: React.ReactNode
  label: string
  active?: boolean
  pill?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-[52px] w-[76px] items-center justify-center rounded-xl transition-colors hover:bg-[#1e1e1e] ${
        active ? 'text-white' : 'text-[#4d4d4d] hover:text-[#b0b0b0]'
      }`}
    >
      {pill ? (
        <span className="flex h-9 w-12 items-center justify-center rounded-xl bg-[#1e1e1e] text-[#9a9a9a]">
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}