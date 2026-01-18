'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SettingsPage() {
  // 1. Initialize the theme hook
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch (wait for client load)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black overflow-hidden relative">
      
      {/* Background Decor (Same as Dashboard) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>

      {/* SIDEBAR (Simplified for this page) */}
      <aside className="w-64 bg-white/10 backdrop-blur-md border-r border-white/10 flex flex-col p-6 hidden md:flex">
        <h2 className="text-2xl font-bold text-white mb-10 tracking-tight">যোগাযোগ</h2>
        <nav className="flex-1 space-y-4">
          <Link href="/dashboard" className="text-white/50 font-medium p-3 hover:bg-white/5 rounded-xl cursor-pointer transition block">
            Global Chat
          </Link>
          <div className="text-white font-medium p-3 bg-white/10 rounded-xl cursor-pointer">
            Settings
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        {/* Appearance Section */}
        <section className="max-w-2xl">
          <h2 className="text-xl font-semibold text-indigo-200 mb-4">Appearance</h2>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-xl">
            <p className="text-gray-300 mb-6 text-sm">Choose how Jogajog looks to you.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* LIGHT MODE BUTTON */}
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  theme === 'light' 
                    ? 'border-indigo-400 bg-indigo-500/20 text-white' 
                    : 'border-transparent bg-black/20 text-gray-400 hover:bg-black/30'
                }`}
              >
                <div className="w-10 h-10 bg-white rounded-full mb-3 flex items-center justify-center shadow-lg">
                   <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <span className="font-medium">Light</span>
              </button>

              {/* DARK MODE BUTTON */}
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-indigo-400 bg-indigo-500/20 text-white' 
                    : 'border-transparent bg-black/20 text-gray-400 hover:bg-black/30'
                }`}
              >
                <div className="w-10 h-10 bg-gray-800 rounded-full mb-3 flex items-center justify-center shadow-lg border border-gray-600">
                   <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                </div>
                <span className="font-medium">Dark</span>
              </button>

              {/* SYSTEM BUTTON */}
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  theme === 'system' 
                    ? 'border-indigo-400 bg-indigo-500/20 text-white' 
                    : 'border-transparent bg-black/20 text-gray-400 hover:bg-black/30'
                }`}
              >
                <div className="w-10 h-10 bg-gray-600 rounded-full mb-3 flex items-center justify-center shadow-lg">
                   <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <span className="font-medium">System</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}