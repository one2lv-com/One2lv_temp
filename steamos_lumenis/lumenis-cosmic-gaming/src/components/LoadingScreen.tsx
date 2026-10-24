import { Sparkles, Rocket } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
      {/* Animated logo */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 animate-pulse-glow flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-white animate-spin" />
        </div>

        {/* Orbiting rings */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }}>
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-purple-400 rounded-full" />
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center">
        <h1 className="text-3xl font-bold cosmic-text mb-4">LUMENIS</h1>
        <div className="flex items-center gap-2 text-cyan-400">
          <Rocket className="w-4 h-4 animate-bounce" />
          <p className="font-medium">{message}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-8 w-64 h-1 bg-cyan-500/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse"
          style={{ width: '60%' }}
        />
      </div>
    </div>
  )
}
