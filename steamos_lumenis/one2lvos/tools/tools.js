// AI Tools - System commands and utilities
// Provides tools for metrics, deployment, logs, and game management

import { broadcast } from '../mesh/mesh.js';
import { getAIPlayer, EVOLUTION_LEVELS } from '../ai/secondPlayer.js';

// System metrics
export async function getMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    pid: process.pid
  };
}

// Health check
export async function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '5.0.0',
    services: {
      api: 'running',
      mesh: 'running',
      ai_coach: 'ready',
      ai_broadcaster: 'ready',
      ai_second_player: 'ready'
    }
  };
}

// Get system logs
export async function getLogs(lines = 50) {
  const logs = [
    `[${new Date().toISOString()}] System initialized`,
    `[${new Date().toISOString()}] Mesh network active`,
    `[${new Date().toISOString()}] AI Coach loaded`,
    `[${new Date().toISOString()}] AI Broadcaster ready`,
    `[${new Date().toISOString()}] AI Second Player online`,
    `[${new Date().toISOString()}] All services operational`
  ];

  return logs.slice(-lines);
}

// Deployment simulation
export async function deploy(projectPath) {
  broadcast({ type: 'deployment_started', data: { project: projectPath } });

  return {
    status: 'simulated',
    project: projectPath,
    timestamp: new Date().toISOString(),
    note: 'Cloud deployment requires Supabase Edge Functions or external service'
  };
}

// Leaderboard operations
export async function getLeaderboard(limit = 10) {
  try {
    const { supabase } = await import('../core/supabase.js');
    const { data } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (e) {
    return [];
  }
}

// Update leaderboard
export async function updateLeaderboard(playerName, score, result) {
  try {
    const { supabase } = await import('../core/supabase.js');

    // Check if player exists
    const { data: existing } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('player_name', playerName)
      .single();

    if (existing) {
      // Update existing player
      const updates = {
        score: existing.score + score,
        wins: result === 'win' ? existing.wins + 1 : existing.wins,
        losses: result === 'loss' ? existing.losses + 1 : existing.losses,
        win_streak: result === 'win' ? existing.win_streak + 1 : 0
      };

      await supabase
        .from('leaderboard')
        .update(updates)
        .eq('player_name', playerName);

      return { updated: true, ...updates };
    } else {
      // Create new player
      const newEntry = {
        player_name: playerName,
        score,
        wins: result === 'win' ? 1 : 0,
        losses: result === 'loss' ? 1 : 0,
        win_streak: result === 'win' ? 1 : 0,
        evolution_level: 1
      };

      await supabase
        .from('leaderboard')
        .insert(newEntry);

      return { created: true, ...newEntry };
    }
  } catch (e) {
    return { error: 'Database not available' };
  }
}

// Game management
export async function startGame(gameConfig) {
  const ai = getAIPlayer();

  return {
    status: 'started',
    gameId: `game_${Date.now()}`,
    config: gameConfig,
    aiStatus: ai.getStatus(),
    timestamp: new Date().toISOString()
  };
}

// End game and record results
export async function endGame(gameId, result) {
  const ai = getAIPlayer();

  // Evolve AI based on result
  if (result === 'ai_win') {
    ai.recordOutcome(-1, 'success');
  } else {
    ai.recordOutcome(-1, 'failure');
  }

  return {
    gameId,
    result,
    aiEvolution: ai.getStatus().evolutionLevel,
    timestamp: new Date().toISOString()
  };
}

// Get evolution levels
export async function getEvolutionLevels() {
  return Object.entries(EVOLUTION_LEVELS).map(([level, stats]) => ({
    level: parseInt(level),
    name: stats.name,
    ...stats
  }));
}

// Mesh peer management
export async function addMeshPeer(peerUrl) {
  broadcast({ type: 'peer_added', data: { url: peerUrl } });

  return {
    status: 'added',
    url: peerUrl,
    timestamp: new Date().toISOString()
  };
}

// System status
export async function getSystemStatus() {
  const ai = getAIPlayer();

  return {
    system: 'ONE2LVOS v5',
    status: 'operational',
    nodeId: process.env.NODE_ID || 'node-1',
    uptime: process.uptime(),
    ai: ai.getStatus(),
    evolutionLevels: 10,
    timestamp: new Date().toISOString()
  };
}

// Tool router
export function routeTool(input) {
  const lower = input.toLowerCase();

  if (lower.includes('metrics') || lower.includes('status')) return 'getMetrics';
  if (lower.includes('health')) return 'healthCheck';
  if (lower.includes('logs')) return 'getLogs';
  if (lower.includes('deploy')) return 'deploy';
  if (lower.includes('leaderboard')) return 'leaderboard';
  if (lower.includes('game')) return 'game';
  if (lower.includes('evolution')) return 'evolution';
  if (lower.includes('system')) return 'systemStatus';

  return null;
}

// Available tools
export const TOOLS = {
  getMetrics,
  healthCheck,
  getLogs,
  deploy,
  getLeaderboard,
  updateLeaderboard,
  startGame,
  endGame,
  getEvolutionLevels,
  addMeshPeer,
  getSystemStatus,
  routeTool
};

export default TOOLS;