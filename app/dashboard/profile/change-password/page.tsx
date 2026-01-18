'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { sendPasswordOtp, verifyAndChangePassword } from '@/app/auth/security-actions'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1) // Step 1: Input Password, Step 2: Input OTP
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0) // Logic to prevent spamming
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user?.email) setEmail(data.user.email)
    }
    getUser()
  }, [])

  // Timer for Resend Button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Function to Send/Resend OTP
  const sendOtpLogic = async () => {
    setLoading(true)
    const res = await sendPasswordOtp(email)
    setLoading(false)

    if (res.error) {
      alert(res.error)
      return false
    } else {
      setResendCooldown(30) // 30 second cooldown
      return true
    }
  }

  const handleGenerateOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }
    
    const success = await sendOtpLogic()
    if (success) {
      alert("OTP sent to your email!")
      setStep(2)
    }
  }

  const handleResend = async () => {
    const success = await sendOtpLogic()
    if (success) alert("Code sent again! Check your inbox.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await verifyAndChangePassword(email, otp, newPassword)
    setLoading(false)

    if (res.error) {
      alert(res.error)
    } else {
      alert("Password changed successfully!")
      router.push('/dashboard/profile')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h1>
        <p className="text-gray-500 mb-6 text-sm">Secure your account with a new password.</p>

        <form onSubmit={step === 1 ? handleGenerateOtp : handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={step === 2}
              placeholder="Enter new password"
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
              <input 
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Check your email for code"
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition tracking-widest font-mono text-center"
              />
              
              <div className="flex justify-between items-center mt-3 px-1">
                <p className="text-xs text-gray-500">Sent to {email}</p>
                
                {/* RESEND BUTTON */}
                <button 
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-70"
          >
            {loading ? 'Processing...' : (step === 1 ? 'Generate OTP' : 'Verify & Change Password')}
          </button>

          <button 
            type="button" 
            onClick={() => router.back()}
            className="w-full text-center text-gray-500 text-sm hover:text-gray-700 mt-4"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}