'use client'

import { useState, useEffect } from 'react'
import { requestEmailChange, verifyEmailChange } from '@/app/auth/security-actions'
import { useRouter } from 'next/navigation'

export default function ChangeEmailPage() {
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()

  // Timer logic
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Shared Logic for Sending
  const sendOtpLogic = async () => {
    setLoading(true)
    const res = await requestEmailChange(newEmail)
    setLoading(false)

    if (res.error) {
      alert(res.error)
      return false
    } else {
      setResendCooldown(30)
      return true
    }
  }

  const handleGenerateOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.includes('@')) {
      alert("Please enter a valid email")
      return
    }

    const success = await sendOtpLogic()
    if (success) {
      alert("OTP sent to your NEW email address!")
      setStep(2)
    }
  }

  const handleResend = async () => {
    const success = await sendOtpLogic()
    if (success) alert("Code sent again! Check the inbox of your NEW email.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await verifyEmailChange(newEmail, otp)
    setLoading(false)

    if (res.error) {
      alert(res.error)
    } else {
      alert("Email updated successfully!")
      router.push('/dashboard/profile')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Change Email</h1>
        <p className="text-gray-500 mb-6 text-sm">We need to verify your new email address.</p>

        <form onSubmit={step === 1 ? handleGenerateOtp : handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Email Address</label>
            <input 
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              disabled={step === 2}
              placeholder="you@example.com"
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Verification Code</label>
              <input 
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Code from new email"
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition tracking-widest font-mono text-center"
              />
              
              <div className="flex justify-between items-center mt-3 px-1">
                <p className="text-xs text-gray-500">Sent to {newEmail}</p>
                
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
            {loading ? 'Processing...' : (step === 1 ? 'Generate OTP' : 'Verify & Change Email')}
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