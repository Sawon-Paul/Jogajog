'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { sendMessage } from '@/app/auth/actions'

type Message = {
  id: number
  content: string
  user_name: string
  user_id: string
  created_at: string
}

export default function ChatInterface({ currentUser }: { currentUser: any }) {
  const [messages, setMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // 1. Fetch initial messages and listen for new ones
  useEffect(() => {
    // Get initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data)
    }
    fetchMessages()

    // Listen for NEW messages in realtime
    const channel = supabase
      .channel('realtime messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // 2. Auto-scroll to bottom when message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10">
      
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          Global Room
        </h3>
        <span className="text-xs text-green-400 flex items-center gap-1 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((msg) => {
          const isMe = msg.user_id === currentUser.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-3 shadow-md ${
                isMe 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
              }`}>
                {!isMe && <p className="text-xs text-indigo-300 font-bold mb-1 opacity-80">{msg.user_name}</p>}
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form 
        action={async (formData) => {
          await sendMessage(formData)
          const form = document.getElementById('chat-form') as HTMLFormElement
          form.reset()
        }}
        id="chat-form"
        className="p-4 bg-white/5 border-t border-white/10 flex gap-3"
      >
        <input 
          name="content" 
          required 
          placeholder="Type a message..." 
          className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder-white/30"
          autoComplete="off"
        />
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition shadow-lg flex items-center justify-center">
          <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
        </button>
      </form>
    </div>
  )
}