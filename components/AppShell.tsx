'use client'

import { useRouter } from 'next/navigation'
import { Wordmark } from './Wordmark'
import { OnlineCounter, CompactOnlineCounter } from './OnlineCounter'
import { DesktopNotificationsButton, MobileNotificationsButton } from './NotificationsNavButton'
import {
  HomeIcon,
  SearchIcon,
  ComposeIcon,
  UserIcon,
} from './icons'
import type { ReactNode } from 'react'

type ActiveTab = 'home' | 'search' | 'notifications'

export function AppShell({
  active,
  onCompose,
  children,
}: {
  active: ActiveTab
  onCompose: () => void
  children: ReactNode
}) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      {/* Desktop top bar */}
      <header className="fixed inset-x-0 top-0 z-40 hidden h-[76px] grid-cols-3 items-center px-6 md:grid">
        <Wordmark className="text-[22px]" />

        <nav className="flex items-center justify-center gap-1">
          <NavButton
            label="Home"
            active={active === 'home'}
            onClick={() => router.push('/')}
          >
            <HomeIcon filled={active === 'home'} className="h-[26px] w-[26px]" />
          </NavButton>
          <NavButton
            label="Search"
            active={active === 'search'}
            onClick={() => router.push('/search')}
          >
            <SearchIcon className="h-[26px] w-[26px]" />
          </NavButton>
          <NavButton label="New post" onClick={onCompose} pill>
            <ComposeIcon className="h-[22px] w-[22px]" />
          </NavButton>
          <DesktopNotificationsButton />
          <NavButton label="Profile" onClick={() => router.push('/settings')}>
            <UserIcon className="h-[26px] w-[26px]" />
          </NavButton>
        </nav>

        <div className="flex justify-end">
          <div className="flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#181818] px-3 py-1.5 text-[13px] text-[#9a9a9a]">
            <OnlineCounter />
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex justify-center bg-[#101010]/90 py-2.5 backdrop-blur-md md:hidden">
        <Wordmark className="text-[19px]" />
      </header>

      {/* Page content */}
      <main className="mx-auto w-full min-w-0 pb-24 md:max-w-[640px] md:pb-0 md:pt-[76px]">
        <div className="min-h-screen min-w-0 overflow-x-hidden border-[#2a2a2a] bg-[#181818] md:rounded-t-[28px] md:border md:border-b-0">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 items-center bg-[#101010]/95 px-3 pb-5 pt-2.5 backdrop-blur-md md:hidden">
        <button
          onClick={() => router.push('/')}
          aria-label="Home"
          className="justify-self-center"
        >
          <HomeIcon
            filled={active === 'home'}
            className={`h-[22px] w-[22px] ${active === 'home' ? 'text-white' : 'text-[#4d4d4d]'}`}
          />
        </button>

        <button
          onClick={() => router.push('/search')}
          aria-label="Search"
          className="justify-self-center"
        >
          <SearchIcon
            className={`h-[22px] w-[22px] ${active === 'search' ? 'text-white' : 'text-[#4d4d4d]'}`}
          />
        </button>

        <button
          onClick={onCompose}
          aria-label="New post"
          className="justify-self-center rounded-xl bg-[#1e1e1e] px-4 py-2 text-[#9a9a9a]"
        >
          <ComposeIcon className="h-5 w-5" />
        </button>

        <MobileNotificationsButton />

        <div className="flex items-center justify-center justify-self-center rounded-full bg-[#1e1e1e] px-3 py-2">
          <CompactOnlineCounter />
        </div>
      </nav>
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
  children: ReactNode
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