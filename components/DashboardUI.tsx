'use client'

import ChatBadge from './ChatBadge' // Adjust path if needed, e.g. '@/components/ChatBadge'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

export default function DashboardUI({ user, children }: { user: any, children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme() // Theme Hook
  const [mounted, setMounted] = useState(false)

  // Wait for client to mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path: string) => pathname === path

  return (
    // Use 'bg-background' so it switches automatically
    <div className="flex h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR - Uses 'bg-sidebar' */}
      <aside 
        className={`
          bg-sidebar text-sidebar-text flex flex-col transition-all duration-300 ease-in-out border-r border-border
          ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}
        `}
      >
        <div className="h-16 flex items-center px-4 gap-4 border-b border-white/10">
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg opacity-70 hover:opacity-100 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <h2 className="text-xl font-bold whitespace-nowrap tracking-wide">
            Jogajog
          </h2>
        </div>
        
        <nav className="flex-1 space-y-2 p-4">
          <Link href="/dashboard" className={`flex items-center gap-3 font-medium p-3 rounded-xl transition whitespace-nowrap ${isActive('/dashboard') ? 'bg-white/10 opacity-100' : 'opacity-70 hover:bg-white/5 hover:opacity-100'}`}>
             Dashboard
          </Link>
          <Link href="/dashboard/chat" className={`flex items-center gap-3 font-medium p-3 rounded-xl transition whitespace-nowrap ${isActive('/dashboard/chat') ? 'bg-white/10 opacity-100' : 'opacity-70 hover:bg-white/5 hover:opacity-100'}`}>
             Chat
             <ChatBadge />
          </Link>
          <Link href="/dashboard/profile" className={`flex items-center gap-3 font-medium p-3 rounded-xl transition whitespace-nowrap ${isActive('/dashboard/profile') ? 'bg-white/10 opacity-100' : 'opacity-70 hover:bg-white/5 hover:opacity-100'}`}>
             Profile
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <form action="/auth/signout" method="post">
            <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-lg font-bold">
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER - Uses 'bg-card' */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 justify-between shadow-sm z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
            )}
            <h1 className="text-xl font-bold">Jogajog</h1>
          </div>

          <div className="flex items-center gap-4">
             {/* THEME TOGGLE */}
             {mounted && (
               <button
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                 className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:opacity-80 transition"
               >
                 {theme === 'dark' ? '🌞' : '🌙'}
               </button>
             )}

             <Link href="/dashboard/profile" className="flex items-center gap-3 cursor-pointer">
                <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  {user.email[0].toUpperCase()}
                </div>
             </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
           {children}
        </div>

      </main>
    </div>
  )
}