'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function ChatBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Count unread messages where I am the receiver
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      setUnreadCount(count || 0)
    }

    fetchUnread()

    // Real-time Listener for Sidebar
    const channel = supabase
      .channel('global_badge')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        (payload: any) => {
          // If a new message arrives or is read, simple re-fetch the count
          // (Fetching count is very cheap/fast)
          fetchUnread()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (unreadCount === 0) return null

  return (
    <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )
}