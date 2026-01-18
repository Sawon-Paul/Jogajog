'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function ChatPage() {
  const [friends, setFriends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFriend, setSelectedFriend] = useState<any>(null)
  const [messageText, setMessageText] = useState('')
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  
  // NEW: Track who is online
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Mark messages as "Read"
  const markAsRead = async (senderId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      
    if (!error) {
      setFriends(prev => prev.map(f => 
        f.id === senderId ? { ...f, unread: 0 } : f
      ))
    }
  }

  // 2. Fetch User & Friends & Unread Counts
  const fetchFriends = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)

    const { data: relationships } = await supabase
      .from('friends')
      .select('*')
      .eq('status', 'accepted')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)

    if (relationships && relationships.length > 0) {
      const friendIds = relationships.map(rel => 
        rel.user_id_1 === user.id ? rel.user_id_2 : rel.user_id_1
      )
      
      const { data: friendsData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds)

      if (friendsData) {
        const friendsWithCounts = await Promise.all(friendsData.map(async (friend) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', friend.id)
            .eq('receiver_id', user.id)
            .eq('is_read', false)
          
          return { ...friend, unread: count || 0 }
        }))
        
        setFriends(friendsWithCounts)
      }
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  // 3. PRESENCE & REALTIME LISTENER
  useEffect(() => {
    if (!user) return

    // A. Listen for Messages
    const chatChannel = supabase
      .channel('chat_page_realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        async (payload) => {
          const newMsg = payload.new

          // If looking at this chat
          if (selectedFriend && (
             (newMsg.sender_id === selectedFriend.id && newMsg.receiver_id === user.id) ||
             (newMsg.sender_id === user.id && newMsg.receiver_id === selectedFriend.id)
          )) {
             setMessages((prev) => [...prev, newMsg])
             if (newMsg.sender_id === selectedFriend.id) {
               await markAsRead(selectedFriend.id)
             }
          } 
          // If receiving from someone else
          else if (newMsg.receiver_id === user.id) {
             setFriends(prev => prev.map(f => 
               f.id === newMsg.sender_id 
                 ? { ...f, unread: (f.unread || 0) + 1 } 
                 : f
             ))
          }
        }
      )
      .subscribe()

    // B. Listen for Online Status (Presence)
    const presenceChannel = supabase.channel('online-users')
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState()
        const ids = new Set<string>()
        for (const key in newState) {
          // @ts-ignore
          if (newState[key]?.[0]?.user_id) {
             // @ts-ignore
             ids.add(newState[key][0].user_id)
          }
        }
        setOnlineUsers(ids)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id })
        }
      })

    return () => {
      supabase.removeChannel(chatChannel)
      presenceChannel.unsubscribe()
    }
  }, [user, selectedFriend])


  // 4. Select Friend Logic
  const handleSelectFriend = async (friend: any) => {
    setSelectedFriend(friend)
    if (friend.unread > 0) {
      await markAsRead(friend.id)
    }

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
  }

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !user || !selectedFriend) return

    const textToSend = messageText
    setMessageText('') 

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedFriend.id,
        content: textToSend,
        is_read: false
      })

    if (error) alert('Failed to send')
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading chats...</div>

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <div className={`${selectedFriend ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg text-gray-800 dark:text-white">Messages</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{friends.length} Friends</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {friends.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No friends yet.</div>
          ) : (
            friends.map((friend) => {
              const isOnline = onlineUsers.has(friend.id)

              return (
                <div 
                  key={friend.id}
                  onClick={() => handleSelectFriend(friend)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                    selectedFriend?.id === friend.id 
                      ? 'bg-indigo-100 dark:bg-indigo-900/50' 
                      : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    
                    {/* AVATAR + ONLINE DOT */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden relative border border-gray-200 dark:border-gray-700">
                        {friend.avatar_url ? (
                          <img src={friend.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {friend.email[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Green Dot on Sidebar Avatar */}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-800 bg-green-500"></span>
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <p className={`truncate ${friend.unread > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {friend.full_name || friend.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {friend.unread > 0 ? 'New message!' : isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  
                  {friend.unread > 0 && (
                    <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      {friend.unread}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT MAIN */}
      <div className={`${!selectedFriend ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white dark:bg-slate-800`}>
        {selectedFriend ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-slate-800">
              <button onClick={() => setSelectedFriend(null)} className="md:hidden text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              
              <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden relative border border-gray-200 dark:border-gray-700">
                {selectedFriend.avatar_url ? (
                  <img src={selectedFriend.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {selectedFriend.email[0].toUpperCase()}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{selectedFriend.full_name || selectedFriend.email}</h3>
                
                {/* REAL ONLINE STATUS INDICATOR */}
                {onlineUsers.has(selectedFriend.id) ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online Now
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Offline</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900/30">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                  <p>Say hello to {selectedFriend.full_name}!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender_id === user.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-none'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          <span className="ml-1">
                            {msg.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-900 border border-transparent focus:border-indigo-500 rounded-xl outline-none text-gray-900 dark:text-white transition"
                />
                <button type="submit" disabled={!messageText.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white p-3 rounded-xl transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select a Conversation</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Choose a friend from the sidebar to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}