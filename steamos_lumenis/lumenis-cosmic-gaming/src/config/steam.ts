// Steam API Integration Configuration
// Steam Web API Key: configure via VITE_STEAM_API_KEY env var

export const STEAM_CONFIG = {
  apiKey: import.meta.env.VITE_STEAM_API_KEY || '',
  domain: import.meta.env.VITE_STEAM_DOMAIN || 'https://github.com/one2lv-com/Lumenis.io',

  // Steam API Endpoints
  endpoints: {
    playerSummaries: 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',
    ownedGames: 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/',
    playerBans: 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/',
    resolveVanity: 'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/',
  },

  // Brawlhalla on Steam (App ID: 291550)
  brawlhallaAppId: '291550',

  // OAuth Configuration
  oauth: {
    clientId: '',
    redirectUri: `${import.meta.env.VITE_STEAM_DOMAIN || 'https://github.com/one2lv-com/Lumenis.io'}/auth/steam/callback`,
  }
}

// Helper functions for Steam API calls
export async function getSteamPlayerSummary(steamId: string) {
  const url = `${STEAM_CONFIG.endpoints.playerSummaries}?key=${STEAM_CONFIG.apiKey}&steamids=${steamId}&format=json`
  const response = await fetch(url)
  const data = await response.json()
  return data.response?.players?.[0]
}

export async function getSteamOwnedGames(steamId: string) {
  const url = `${STEAM_CONFIG.endpoints.ownedGames}?key=${STEAM_CONFIG.apiKey}&steamid=${steamId}&include_played_free_games=true&format=json`
  const response = await fetch(url)
  const data = await response.json()
  return data.response?.games || []
}

export async function checkBrawlhallaOwnership(steamId: string): Promise<boolean> {
  const games = await getSteamOwnedGames(steamId)
  return games.some((game: any) => game.appid.toString() === STEAM_CONFIG.brawlhallaAppId)
}

export async function getSteamPlayerBans(steamId: string) {
  const url = `${STEAM_CONFIG.endpoints.playerBans}?key=${STEAM_CONFIG.apiKey}&steamids=${steamId}&format=json`
  const response = await fetch(url)
  const data = await response.json()
  return data.players?.[0]
}
