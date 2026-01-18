import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black relative overflow-hidden">
      
      {/* Background Glow Effects (The "Creative" Part) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[128px] opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[128px] opacity-50"></div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-12 rounded-3xl shadow-2xl max-w-md w-full text-center">
        
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200 mb-4 tracking-tighter drop-shadow-sm">
          যোগাযোগ
        </h1>
        
        <p className="text-gray-300 mb-10 text-lg font-light">
          Experience messaging without boundaries.
          <br /> Secure. Fast. Yours.
        </p>
        
        <div className="space-y-4">
          {/* Login Button */}
          <Link 
            href="/login" 
            className="block w-full py-3.5 bg-white text-indigo-900 font-bold rounded-xl shadow-lg hover:bg-gray-50 hover:scale-[1.02] transition-all duration-300"
          >
            Log In
          </Link>
          
          {/* Sign Up Button */}
          <Link 
            href="/signup" 
            className="block w-full py-3.5 bg-indigo-600/30 text-white font-semibold rounded-xl border border-white/10 hover:bg-indigo-600/50 hover:scale-[1.02] transition-all duration-300"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}