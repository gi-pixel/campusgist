'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useOnlineCount() {
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    
    // We create a channel just for tracking presence
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: 'any', // We don't need unique user IDs for just counting
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        // Count the total number of users in the channel
        const count = Object.keys(state).length
        setOnlineCount(count)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Broadcast that we are here
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return onlineCount
}