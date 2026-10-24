import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

let count = 0
let started = false
let channel: RealtimeChannel | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function start() {
  if (started) return
  started = true

  const key =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  const supabase = createClient()
  channel = supabase.channel('online-users', { config: { presence: { key } } })

  channel
    .on('presence', { event: 'sync' }, () => {
      count = Object.keys(channel!.presenceState()).length
      emit()
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel!.track({ online_at: new Date().toISOString() })
      }
    })
}

// Any number of components can subscribe; the channel is opened only once
export function subscribeOnline(cb: () => void) {
  listeners.add(cb)
  start()
  return () => {
    listeners.delete(cb)
  }
}

export function getOnlineCount() {
  return count
}