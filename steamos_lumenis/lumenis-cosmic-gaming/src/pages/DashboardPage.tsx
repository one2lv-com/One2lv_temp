import { useState, useEffect } from 'react'
import {
  Trophy,
  Bot,
  Gamepad2,
  Clock,
  TrendingUp,
  Zap,
  Sparkles,
  ChevronRight,
  Activity
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, PlayerStats } from '../lib/supabase'

const quickActions = [
  {
    title: 'AI Coach',
    description: 'Get strategy tips from Gemini',
    icon: Bot,
    path: '/coach',
    color: 'from-purple-500 to-pink-500',
    quote: 'Distinguish the Nettle from the Medicine.'
  },
  {
    title: 'AI Fighter',
    description: 'Battle against AI opponent',
    icon: Gamepad2,
    path: '/fighter',
    color: 'from-cyan-500 to-blue-500',
    quote: 'When ME 3E becomes Null, let the Light break through.'
  },
  {
    title: 'Leaderboard',
    description: 'View global rankings',
    icon: Trophy,
    path: '/leaderboard',
    color: 'from-yellow-500 to-orange-500',
    quote: 'We walk in the name Jak! forever.'
  }
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [user])

  const loadStats = async () => {
    if (!user) return

    try {
      // Load player stats
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (statsData) {
        setStats(statsData)
      }

      // Load recent matches
      const { data: matchesData } = await supabase
        .from('game_matches')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(5)

      if (matchesData) {
        setRecentMatches(matchesData)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Demo stats for guests
  const displayStats = stats || {
    rating: 1200,
    wins: 0,
    losses: 0,
    win_rate: 0,
    playtime_hours: 0
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold cosmic-text">
            Welcome, {user?.username || 'Guest'}
          </h1>
          <p className="text-cyan-400/70 mt-1">
            "You are One2lv. You are the Architect of the Rebuild."
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg holo-panel">
          <Activity className="w-5 h-5 text-green-400" />
          <span className="text-sm text-green-400">System Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Rating"
          value={displayStats.rating}
          icon={TrendingUp}
          color="cyan"
        />
        <StatCard
          label="Wins"
          value={displayStats.wins}
          icon={Trophy}
          color="green"
        />
        <StatCard
          label="Losses"
          value={displayStats.losses}
          icon={Zap}
          color="red"
        />
        <StatCard
          label="Play Time"
          value={`${displayStats.playtime_hours}h`}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Win Rate */}
      <div className="p-6 rounded-lg holo-panel">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Win Rate Analysis
        </h2>
        <div className="relative h-4 bg-cyan-500/20 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
            style={{ width: `${displayStats.win_rate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-400">
          <span>0%</span>
          <span className="text-cyan-400 font-semibold">{displayStats.win_rate.toFixed(1)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group relative p-6 rounded-lg holo-panel text-left
                transition-all duration-300 hover:scale-[1.02] hover:border-cyan-500/40"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} p-3 mb-4`}>
                <action.icon className="w-full h-full text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-cyan-400 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-400 mb-2">{action.description}</p>
              <p className="text-xs text-cyan-400/50 italic">{action.quote}</p>
              <ChevronRight className="absolute top-4 right-4 w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      <div className="p-6 rounded-lg holo-panel">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Recent Matches
        </h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading match history...
          </div>
        ) : recentMatches.length > 0 ? (
          <div className="space-y-3">
            {recentMatches.map((match, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg bg-black/30"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${match.result === 'win' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium">
                      vs {match.opponent_id || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(match.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${match.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                    {match.result === 'win' ? 'VICTORY' : 'DEFEAT'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Rating: {match.opponent_rating || '?'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No matches played yet</p>
            <button
              onClick={() => navigate('/fighter')}
              className="btn-cosmic"
            >
              Start Your First Match
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  icon: any
  color: 'cyan' | 'green' | 'red' | 'purple' | 'yellow'
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/10',
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10'
  }

  return (
    <div className="p-6 rounded-lg holo-panel">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
