'use client'

import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { NotificationList } from '@/components/NotificationList'
import { ComposerModal } from '@/components/ComposerModal'

export default function NotificationsPage() {
  const [composerOpen, setComposerOpen] = useState(false)

  return (
    <AppShell active="notifications" onCompose={() => setComposerOpen(true)}>
      <div className="border-b border-[#2a2a2a] px-5 py-4">
        <h1 className="text-[17px] font-bold">Notifications</h1>
      </div>

      <NotificationList />

      <ComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={() => {}}
      />
    </AppShell>
  )
}