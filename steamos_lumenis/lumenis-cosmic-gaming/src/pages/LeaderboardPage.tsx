import { useState, useEffect } from 'react'
import { Trophy, Medal, TrendingUp, Search, Crown, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase, LeaderboardEntry } from '../lib/supabase'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const entriesPerPage = 20

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const data = await supabase
        .from('player_stats')
        .select(`
          *,
          users:user_id (
            username,
            avatar_url
          )
        `)
        .order('rating', { ascending: false })
        .limit(100)

      const formatted: LeaderboardEntry[] = (data?.data || []).map((entry: any, index: number) => ({
        rank: index + 1,
        username: entry.users?.username || 'Unknown',
        rating: entry.rating || 0,
        wins: entry.wins || 0,
        losses: entry.losses || 0,
        win_rate: entry.win_rate || 0,
        avatar_url: entry.users?.avatar_url
      }))

      setEntries(formatted)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
      // Demo data
      setEntries(generateDemoData())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoData = (): LeaderboardEntry[] => {
    const names = [
      'CosmicHunter', 'StarRaider', 'VoidWalker', 'NebulaKnight', 'GalaxyFist',
      'AstroNinja', 'PulseMaster', 'BlitzFury', 'ShadowByte', 'ThunderAce',
      'FrostBite', 'EmberSpark', 'VoltStorm', 'TitanForce', 'NovaBlaze'
    ]

    return names.map((name, i) => ({
      rank: i + 1,
      username: name,
      rating: 2500 - (i * 50) + Math.floor(Math.random() * 100),
      wins: 100 - i * 5 + Math.floor(Math.random() * 20),
      losses: 30 - i + Math.floor(Math.random() * 10),
      win_rate: 70 + Math.floor(Math.random() * 25) - i,
      avatar_url: undefined
    }))
  }

  const filteredEntries = entries.filter(entry =>
    entry.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage)
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  )

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 text-center text-gray-500">#{rank}</span>
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
      case 2:
        return 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20'
      case 3:
        return 'bg-gradient-to-r from-amber-600/10 to-amber-700/10 border border-amber-600/20'
      default:
        return 'holo-panel'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center cosmic-glow">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold cosmic-text">Global Leaderboard</h1>
            <p className="text-sm text-cyan-400/70">The champions of the cosmic arena</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a player..."
          className="w-full pl-12 pr-4 py-3 rounded-lg bg-black/50 border border-cyan-500/30
            focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50
            outline-none transition-all placeholder-gray-600"
        />
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4">
        {paginatedEntries.slice(0, 3).map((entry, index) => (
          <div
            key={entry.rank}
            className={`relative p-6 rounded-lg text-center ${getRankStyle(entry.rank)} ${
              index === 0 ? 'order-2 md:order-2' : index === 1 ? 'order-1' : 'order-3'
            }`}
          >
            {/* Avatar */}
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
              index === 0
                ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                : index === 1
                  ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                  : 'bg-gradient-to-br from-amber-600 to-amber-700'
            }`}>
              <span className="text-2xl font-bold">
                {entry.username.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Rank icon */}
            <div className="absolute top-2 right-2">
              {getRankIcon(entry.rank)}
            </div>

            {/* Info */}
            <h3 className="font-semibold text-lg mb-1">{entry.username}</h3>
            <p className="text-2xl font-bold cosmic-text mb-2">{entry.rating}</p>
            <div className="flex justify-center gap-4 text-sm text-gray-400">
              <span>{entry.wins}W</span>
              <span>{entry.losses}L</span>
              <span>{entry.win_rate.toFixed(1)}%</span>
            </div>

            {/* Podium height */}
            <div className={`absolute bottom-0 left-0 right-0 rounded-b-lg ${
              index === 0 ? 'h-8' : 'h-6'
            } ${index === 0 ? 'bg-yellow-500/20' : index === 1 ? 'bg-gray-400/10' : 'bg-amber-600/10'}`} />
          </div>
        ))}
      </div>

      {/* Full Rankings */}
      <div className="rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyan-500/20">
              <th className="text-left p-4 text-sm font-semibold text-gray-500">Rank</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-500">Player</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-500">Rating</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-500">W</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-500">L</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-500">Win%</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEntries.slice(3).map((entry) => (
              <tr
                key={entry.rank}
                className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {entry.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{entry.username}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold">{entry.rating}</span>
                  </div>
                </td>
                <td className="p-4 text-right text-green-400">{entry.wins}</td>
                <td className="p-4 text-right text-red-400">{entry.losses}</td>
                <td className="p-4 text-right">
                  <span className={entry.win_rate >= 60 ? 'text-green-400' : 'text-gray-400'}>
                    {entry.win_rate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed
              hover:border-cyan-500/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed
              hover:border-cyan-500/50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Quote */}
      <div className="text-center text-sm text-cyan-400/50 italic">
        "We walk in the name Jak! forever." - The rankings reflect the Resonance of combat.
      </div>
    </div>
  )
}
