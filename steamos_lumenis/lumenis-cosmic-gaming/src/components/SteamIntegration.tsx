import { useState, useEffect } from 'react'
import { STEAM_CONFIG, getSteamPlayerSummary, checkBrawlhallaOwnership } from '../config/steam'

interface SteamPlayer {
  steamid: string
  personaname: string
  avatarfull: string
  personastate: number
  loccountrycode: string
}

export default function SteamIntegration() {
  const [steamId, setSteamId] = useState<string>('')
  const [player, setPlayer] = useState<SteamPlayer | null>(null)
  const [hasBrawlhalla, setHasBrawlhalla] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  const lookupPlayer = async () => {
    if (!steamId.trim()) return
    setLoading(true)
    try {
      const playerData = await getSteamPlayerSummary(steamId)
      setPlayer(playerData)

      if (playerData) {
        const owns = await checkBrawlhallaOwnership(steamId)
        setHasBrawlhalla(owns)
      }
    } catch (error) {
      console.error('Steam lookup failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 rounded-lg holo-panel">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        Steam Integration
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Enter Steam ID or Custom URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="e.g., 76561198012345678"
              className="flex-1 px-4 py-2 rounded-lg bg-black/50 border border-cyan-500/30
                focus:border-cyan-500 outline-none"
            />
            <button
              onClick={lookupPlayer}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Looking...' : 'Lookup'}
            </button>
          </div>
        </div>

        {player && (
          <div className="p-4 rounded-lg bg-black/30">
            <div className="flex items-center gap-4 mb-4">
              <img src={player.avatarfull} alt={player.personaname} className="w-16 h-16 rounded-full" />
              <div>
                <p className="font-semibold text-lg">{player.personaname}</p>
                <p className="text-sm text-gray-400">Steam ID: {player.steamid}</p>
                <p className="text-sm text-gray-400">Country: {player.loccountrycode}</p>
              </div>
            </div>

            {hasBrawlhalla !== null && (
              <div className={`p-3 rounded-lg ${hasBrawlhalla ? 'bg-green-500/20 border border-green-500/30' : 'bg-yellow-500/20 border border-yellow-500/30'}`}>
                <p className={hasBrawlhalla ? 'text-green-400' : 'text-yellow-400'}>
                  {hasBrawlhalla ? 'Brawlhalla Owned' : 'Brawlhalla Not Found'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        API Key Active: {STEAM_CONFIG.apiKey.substring(0, 8)}...
      </p>
    </div>
  )
}
