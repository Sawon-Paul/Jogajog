'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  
  // Connection States
  const [connections, setConnections] = useState<Record<string, { status: string, rowId: string }>>({})
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  
  // Presence State (New)
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())

  const [stats, setStats] = useState({
    totalFriends: 0,
    friendRequests: 0,
    onlineFriends: 0 
  })

  const supabase = createClient()

  // 1. Fetch Data Function
  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)

    // Fetch ALL relationships
    const { data: relationships } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)

    const tempConnections: Record<string, { status: string, rowId: string }> = {}
    const tempIncoming: any[] = []
    let friendCount = 0
    
    if (relationships) {
      for (const rel of relationships) {
        if (rel.status === 'accepted') {
          const friendId = rel.user_id_1 === user.id ? rel.user_id_2 : rel.user_id_1
          tempConnections[friendId] = { status: 'accepted', rowId: rel.id }
          friendCount++
        } else if (rel.status === 'pending') {
          if (rel.user_id_1 === user.id) {
            tempConnections[rel.user_id_2] = { status: 'sent_pending', rowId: rel.id }
          } else {
            tempConnections[rel.user_id_1] = { status: 'received_pending', rowId: rel.id }
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', rel.user_id_1)
              .single()
            
            if (profile) tempIncoming.push({ ...rel, profile })
          }
        }
      }
    }

    setConnections(tempConnections)
    setIncomingRequests(tempIncoming)
    
    // Calculate stats (Note: onlineFriends is recalculated in useEffect below)
    setStats(prev => ({
      ...prev,
      totalFriends: friendCount,
      friendRequests: tempIncoming.length,
    }))
    
    setLoading(false)
  }, [supabase])

  // 2. Initial Fetch, Real-Time DB, AND Presence
  useEffect(() => {
    fetchData()

    // A. Database Listener (Friends Table)
    const dbChannel = supabase
      .channel('dashboard-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friends' }, 
        () => fetchData()
      )
      .subscribe()

    // B. Presence Listener (Online Status)
    const presenceChannel = supabase.channel('online-users')

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState()
        const ids = new Set<string>()
        
        // Extract all user IDs currently online
        for (const key in newState) {
          // Each key is a user, state is an array of their devices
          // @ts-ignore
          if (newState[key]?.[0]?.user_id) {
             // @ts-ignore
             ids.add(newState[key][0].user_id)
          }
        }
        setOnlineUserIds(ids)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Tell Supabase: "I am here!"
            await presenceChannel.track({ user_id: user.id })
          }
        }
      })

    return () => {
      supabase.removeChannel(dbChannel)
      presenceChannel.unsubscribe() // Correct cleanup for presence
    }
  }, [fetchData, supabase])

  // 3. Update "Online Friends" Stat whenever Data or Presence changes
  useEffect(() => {
    // Count how many IDs in 'onlineUserIds' are also in 'connections' with status 'accepted'
    let count = 0
    onlineUserIds.forEach(id => {
      if (connections[id]?.status === 'accepted') {
        count++
      }
    })
    
    setStats(prev => ({ ...prev, onlineFriends: count }))
  }, [onlineUserIds, connections])


  // 4. Search Logic
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchMessage('')
    setSearchResults([])

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id)
      .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .limit(5)

    if (data && data.length > 0) {
      setSearchResults(data)
    } else {
      setSearchMessage("No users found.")
    }
    setSearching(false)
  }

  // 5. Actions
  const addFriend = async (friendId: string) => {
    setConnections(prev => ({ ...prev, [friendId]: { status: 'sent_pending', rowId: 'temp' } })) 
    await supabase.from('friends').insert({ user_id_1: user.id, user_id_2: friendId, status: 'pending' })
  }

  const cancelSentRequest = async (friendId: string) => {
    const connection = connections[friendId]
    if (!connection) return
    setConnections(prev => { const n = { ...prev }; delete n[friendId]; return n })
    if (connection.rowId && connection.rowId !== 'temp') {
        await supabase.from('friends').delete().eq('id', connection.rowId)
    } else {
        await supabase.from('friends').delete().eq('user_id_1', user.id).eq('user_id_2', friendId)
    }
  }

  const acceptRequest = async (rowId: string) => {
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', rowId)
  }

  const declineRequest = async (rowId: string) => {
    await supabase.from('friends').delete().eq('id', rowId)
  }

  const scrollToRequests = () => {
    const el = document.getElementById('friend-requests-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="space-y-8">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Overview of your network</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <form onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search people..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm"
            />
            <button type="submit" className="absolute right-2 top-2 bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition">
              {searching ? (
                <span className="animate-spin h-5 w-5 block border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Friends */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Friends</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.totalFriends}</h3>
            </div>
          </div>
        </div>

        {/* Friend Requests */}
        <div onClick={scrollToRequests} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition ${incomingRequests.length > 0 ? 'cursor-pointer hover:shadow-md ring-2 ring-orange-100 dark:ring-orange-900' : 'opacity-80'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Friend Requests</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.friendRequests}</h3>
            </div>
          </div>
        </div>

        {/* Online Now */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Online Now</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.onlineFriends}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS */}
      {(searchResults.length > 0 || searchMessage) && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-lg animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Search Results</h3>
            <button onClick={() => { setSearchResults([]); setSearchMessage('') }} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          {searchMessage && <p className="text-sm text-gray-500 mb-2">{searchMessage}</p>}

          <div className="space-y-4">
            {searchResults.map((person) => {
              const connection = connections[person.id]
              const status = connection?.status
              
              return (
                <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                        {person.email ? person.email[0].toUpperCase() : '?'}
                      </div>
                      <div>
                         <p className="font-semibold text-gray-900 dark:text-white">{person.full_name || person.email}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">{person.email}</p>
                      </div>
                   </div>
                   
                   {status === 'accepted' ? (
                     <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-bold rounded-lg">Friends</span>
                   ) : status === 'sent_pending' ? (
                     <button 
                       onClick={() => cancelSentRequest(person.id)}
                       className="px-4 py-2 bg-gray-200 hover:bg-red-100 dark:bg-gray-600 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-300 text-sm font-bold rounded-lg transition"
                     >
                       Cancel Request
                     </button>
                   ) : status === 'received_pending' ? (
                     <span className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-sm font-bold rounded-lg">Check Requests</span>
                   ) : (
                     <button onClick={() => addFriend(person.id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition">Add Friend</button>
                   )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FRIEND REQUEST SECTION */}
      {incomingRequests.length > 0 && (
        <div id="friend-requests-section" className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-6 rounded-2xl shadow-sm animate-in fade-in">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></span>
            Pending Requests
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {req.profile?.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{req.profile?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{req.profile?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptRequest(req.id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition">
                    Accept
                  </button>
                  <button onClick={() => declineRequest(req.id)} className="px-3 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg transition">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}