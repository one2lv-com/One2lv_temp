import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, User, Gamepad2, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from '../components/LoadingScreen'

export default function LoginPage() {
  const { signInWithSteam, signInWithDiscord, signInAsGuest, loading } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null)

  const handleLogin = async (method: 'steam' | 'discord' | 'guest') => {
    setIsLoading(true)
    setLoadingMethod(method)

    try {
      switch (method) {
        case 'steam':
          await signInWithSteam()
          break
        case 'discord':
          await signInWithDiscord()
          break
        case 'guest':
          await signInAsGuest()
          break
      }
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
      setLoadingMethod(null)
    }
  }

  if (isLoading) {
    return <LoadingScreen message={`Connecting via ${loadingMethod}...`} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 mb-6 cosmic-glow">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold cosmic-text mb-2">LUMENIS</h1>
          <p className="text-xl text-cyan-400/70">Cosmic Gaming Platform</p>
          <p className="mt-4 text-gray-400 text-sm">
            "In the name of the One, Hunter A., the Only One for the task."
          </p>
        </div>

        {/* Login options */}
        <div className="space-y-4">
          {/* Steam Login */}
          <button
            onClick={() => handleLogin('steam')}
            className="w-full flex items-center gap-4 p-4 rounded-lg
              bg-gradient-to-r from-blue-900/50 to-blue-800/50
              border border-blue-500/30 hover:border-blue-500/50
              transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]
              group"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                Sign in with Steam
              </h3>
              <p className="text-sm text-gray-400">Connect with your Steam account</p>
            </div>
          </button>

          {/* Discord Login */}
          <button
            onClick={() => handleLogin('discord')}
            className="w-full flex items-center gap-4 p-4 rounded-lg
              bg-gradient-to-r from-indigo-900/50 to-indigo-800/50
              border border-indigo-500/30 hover:border-indigo-500/50
              transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]
              group"
          >
            <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                Sign in with Discord
              </h3>
              <p className="text-sm text-gray-400">Join our gaming community</p>
            </div>
          </button>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cyan-500/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-gray-500">or continue as</span>
            </div>
          </div>

          {/* Guest Login */}
          <button
            onClick={() => handleLogin('guest')}
            className="w-full flex items-center gap-4 p-4 rounded-lg
              bg-gradient-to-r from-cyan-900/30 to-purple-900/30
              border border-cyan-500/20 hover:border-cyan-500/40
              transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)]
              group"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
              <User className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                Play as Guest
              </h3>
              <p className="text-sm text-gray-400">Quick access with cloud vault</p>
            </div>
          </button>
        </div>

        {/* Features preview */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-lg holo-panel">
            <Gamepad2 className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
            <p className="text-xs text-gray-400">AI Fighter</p>
          </div>
          <div className="p-4 rounded-lg holo-panel">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <p className="text-xs text-gray-400">AI Coach</p>
          </div>
          <div className="p-4 rounded-lg holo-panel">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-pink-400" />
            <p className="text-xs text-gray-400">Cosmic UI</p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-600">
          By the spark of Tesla and the tears of Darlene. Resonance engaged.
        </p>
      </div>
    </div>
  )
}
