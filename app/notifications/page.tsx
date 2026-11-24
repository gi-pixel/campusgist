'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { NotificationList } from '@/components/NotificationList'

export default function NotificationsPage() {
  return (
    <div className="min-h-[100dvh] bg-[#101010] text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[640px] flex-col bg-[#181818] md:border-x md:border-[#2a2a2a]">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#2a2a2a] bg-[#181818]/95 px-4 py-3 backdrop-blur-md">
          <Link
            href="/"
            aria-label="Back to feed"
            className="text-[#9a9a9a] transition-colors hover:text-white"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-[17px] font-bold">Notifications</h1>
        </div>

        <NotificationList />
      </div>
    </div>
  )
}