'use client'
import { signup } from '../auth/actions'
import Link from 'next/link'
import { useState } from 'react'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // We handle the form submission here to control the loading state
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault() // Prevent default browser reload
    setIsLoading(true)     // Start the loading spinner

    // Collect the form data
    const formData = new FormData(event.currentTarget)
    
    // Call the server action
    await signup(formData)
    
    // Note: We don't set isLoading(false) because the page 
    // will redirect to the OTP page immediately after this.
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      
      {/* Background Decor Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-overlay filter blur-[100px] opacity-30 animate-pulse"></div>

      <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl shadow-2xl relative z-10">
        <h2 className="text-4xl font-bold mb-2 text-center text-white tracking-tight">
          Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">যোগাযোগ</span>
        </h2>
        <p className="text-gray-300 text-center mb-8">Create your free account today</p>
        
        {/* We use onSubmit to handle the loading state manually */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-medium text-purple-200 mb-1 uppercase tracking-wider">Full Name</label>
                <input name="fullName" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" placeholder="John Doe" />
             </div>
             <div>
                <label className="block text-xs font-medium text-purple-200 mb-1 uppercase tracking-wider">DOB</label>
                <input name="dob" type="date" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition [color-scheme:dark]" />
             </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-purple-200 mb-1 uppercase tracking-wider">Phone Number</label>
            <input name="phone" type="tel" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" placeholder="+880 1XXX-XXXXXX" />
          </div>

          <div>
            <label className="block text-xs font-medium text-purple-200 mb-1 uppercase tracking-wider">Email Address</label>
            <input name="email" type="email" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition" placeholder="you@example.com" />
          </div>

          <div>
            <label className="block text-xs font-medium text-purple-200 mb-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required 
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition pr-12" 
                placeholder="••••••••" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition focus:outline-none"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading} // Disable button while loading
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              // Loading Spinner
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-gray-400">
          Already a member? <Link href="/login" className="text-purple-300 hover:text-white font-semibold transition">Log In</Link>
        </p>
      </div>
    </div>
  )
}