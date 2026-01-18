'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

// 1. THE CONTENT COMPONENT (Your Design + Logic)
function VerifyContent() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    
    // Clean the OTP (remove spaces)
    const cleanToken = otp.trim()
    
    // Attempt to verify the OTP
    const { error } = await supabase.auth.verifyOtp({
      email: email || '',
      token: cleanToken,
      type: 'signup'
    })

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-pulse"></div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Verify it's you</h2>
          <p className="text-indigo-200 text-sm">
            We sent an 8-digit code to <br/> <span className="text-white font-semibold text-lg">{email}</span>
          </p>
        </div>
        
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-indigo-200 mb-3 uppercase tracking-wider text-center">Enter Verification Code</label>
            
            {/* UPDATED INPUT: maxLength is 10 to be safe, styled for 8 */}
            <input 
              type="text" 
              maxLength={10}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-black/20 border border-white/20 text-white text-center text-3xl tracking-[0.25em] font-bold rounded-2xl py-5 focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all placeholder-white/10 font-mono"
              placeholder="00000000"
            />
            <p className="text-xs text-center text-indigo-300/60 mt-2">Enter the code from your email</p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Verifying...
              </span>
            ) : 'Confirm Code'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <button onClick={() => router.back()} className="text-sm text-indigo-200 hover:text-white transition underline underline-offset-4 decoration-indigo-500/30">
            Wrong email? Go back
          </button>
        </div>
      </div>
    </div>
  )
}

// 2. THE PAGE EXPORT (Wraps Content in Suspense to fix Build Error)
export default function VerifyOtp() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Loading verification...</div>}>
      <VerifyContent />
    </Suspense>
  )
}