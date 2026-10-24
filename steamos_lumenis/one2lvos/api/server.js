// ONE2LVOS v5 - API Server
// Core API with all integrations

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

import { initializeDatabase } from '../core/supabase.js';
import { storeMemory, getContext, searchMemory } from '../core/memory.js';
import { broadcast, initializeMesh, getMeshStatus } from '../mesh/mesh.js';
import { coachChat, getCoachingTip } from '../ai/coach.js';
import { generateCommentary, preMatchCommentary, postMatchCommentary, getStreamOverlay } from '../ai/broadcaster.js';
import { getAIPlayer } from '../ai/secondPlayer.js';
import { TOOLS, routeTool } from '../tools/tools.js';

const PORT = process.env.NODE_PORT || 8080;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'one2lv-secret-2024';

const app = express();

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// ==================== AUTH ====================

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token === ADMIN_TOKEN || !process.env.ADMIN_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ==================== HEALTH ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '5.0.0',
    uptime: process.uptime()
  });
});

// ==================== SYSTEM ====================

app.get('/api/system/status', async (req, res) => {
  res.json({
    system: 'ONE2LVOS v5',
    status: 'operational',
    nodeId: process.env.NODE_ID || 'node-1',
    mesh: getMeshStatus(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/system/metrics', async (req, res) => {
  const metrics = await TOOLS.getMetrics();
  res.json(metrics);
});

// ==================== AI COACH ====================

app.post('/api/coach/chat', authMiddleware, async (req, res) => {
  try {
    const { message, playerId = 'anonymous' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Get AI coach response
    const response = await coachChat(message, playerId);

    // Store interaction
    await storeMemory(`Player: ${message}`, playerId);

    res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Coach error:', error);
    res.status(500).json({ error: 'Coach processing failed' });
  }
});

app.get('/api/coach/tip', authMiddleware, (req, res) => {
  const gameState = req.query;

  if (!gameState.playerHealth) {
    return res.status(400).json({ error: 'Game state required' });
  }

  const tip = getCoachingTip(gameState);
  res.json(tip);
});

// ==================== AI BROADCASTER ====================

app.post('/api/broadcaster/commentary', authMiddleware, (req, res) => {
  const { action, gameState } = req.body;

  if (!action || !gameState) {
    return res.status(400).json({ error: 'Action and game state required' });
  }

  const commentary = generateCommentary(action, gameState);

  res.json({
    success: true,
    commentary
  });
});

app.post('/api/broadcaster/prematch', authMiddleware, (req, res) => {
  const { player1, player2 } = req.body;

  const commentary = preMatchCommentary(player1 || 'Player 1', player2 || 'Player 2');

  res.json({
    success: true,
    commentary
  });
});

app.post('/api/broadcaster/postmatch', authMiddleware, (req, res) => {
  const { winner, loser, stats } = req.body;

  const commentary = postMatchCommentary(winner, loser, stats);

  res.json({
    success: true,
    commentary
  });
});

app.get('/api/broadcaster/overlay', (req, res) => {
  res.json(getStreamOverlay());
});

// ==================== AI SECOND PLAYER ====================

app.post('/api/ai/decide', authMiddleware, async (req, res) => {
  try {
    const { gameState, opponentHistory, playerId } = req.body;

    if (!gameState) {
      return res.status(400).json({ error: 'Game state required' });
    }

    const ai = getAIPlayer(playerId);
    const decision = await ai.decideAction(gameState, opponentHistory || []);

    // Broadcast decision to mesh
    broadcast({
      type: 'ai_decision',
      data: decision
    });

    res.json({
      success: true,
      decision
    });
  } catch (error) {
    console.error('AI decision error:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

app.get('/api/ai/status', authMiddleware, (req, res) => {
  const ai = getAIPlayer(req.query.playerId);
  res.json(ai.getStatus());
});

app.post('/api/ai/reset', authMiddleware, (req, res) => {
  // Dynamic import to avoid ESM issues
  import('../ai/secondPlayer.js').then(module => {
    module.resetAI();
    res.json({ success: true, message: 'AI reset to level 1' });
  });
});

app.get('/api/ai/evolution-levels', (req, res) => {
  import('../tools/tools.js').then(module => {
    const levels = module.getEvolutionLevels?.() || [];
    res.json(levels);
  });
});

// ==================== MEMORY ====================

app.post('/api/memory/store', authMiddleware, async (req, res) => {
  const { content, context } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }

  const result = await storeMemory(content, context);

  res.json({
    success: true,
    stored: result
  });
});

app.post('/api/memory/search', authMiddleware, async (req, res) => {
  const { query, limit } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  const results = await searchMemory(query, limit || 5);

  res.json({
    success: true,
    results,
    count: results.length
  });
});

app.get('/api/memory/context', authMiddleware, async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  const context = await getContext(q);

  res.json({
    success: true,
    context
  });
});

// ==================== LEADERBOARD ====================

app.get('/api/leaderboard', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const leaderboard = await TOOLS.getLeaderboard(limit);

  res.json({
    success: true,
    leaderboard
  });
});

app.post('/api/leaderboard/update', authMiddleware, async (req, res) => {
  const { playerName, score, result } = req.body;

  if (!playerName || score === undefined) {
    return res.status(400).json({ error: 'Player name and score required' });
  }

  const update = await TOOLS.updateLeaderboard(playerName, score, result);

  res.json({
    success: true,
    update
  });
});

// ==================== GAME ====================

app.post('/api/game/start', authMiddleware, async (req, res) => {
  const { config, playerName } = req.body;

  const game = await TOOLS.startGame(config || {});

  // Generate prematch commentary
  const commentary = preMatchCommentary(playerName || 'Player', 'AI Opponent');

  res.json({
    success: true,
    game,
    commentary
  });
});

app.post('/api/game/end', authMiddleware, async (req, res) => {
  const { gameId, result } = req.body;

  const endResult = await TOOLS.endGame(gameId, result);

  // Generate postmatch commentary
  const commentary = postMatchCommentary(
    result === 'player_win' ? 'Player' : 'AI',
    result === 'player_win' ? 'AI' : 'Player',
    endResult
  );

  res.json({
    success: true,
    result: endResult,
    commentary
  });
});

// ==================== MESH ====================

app.get('/api/mesh/status', (req, res) => {
  res.json(getMeshStatus());
});

app.post('/api/mesh/broadcast', authMiddleware, (req, res) => {
  const { event } = req.body;

  if (!event) {
    return res.status(400).json({ error: 'Event required' });
  }

  const sent = broadcast(event);

  res.json({
    success: true,
    broadcast: sent
  });
});

app.post('/api/mesh/peer', authMiddleware, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Peer URL required' });
  }

  const result = await TOOLS.addMeshPeer(url);

  res.json({
    success: true,
    result
  });
});

// ==================== UNIFIED CHAT ====================

app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { input, playerId = 'anonymous' } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input required' });
    }

    // Route to appropriate handler
    const toolName = routeTool(input);

    let output = {
      input,
      timestamp: new Date().toISOString()
    };

    // Execute tool if routed
    if (toolName && TOOLS[toolName]) {
      const result = await TOOLS[toolName]();
      output.tool = toolName;
      output.toolResult = result;
    } else {
      // Use AI coach for general queries
      const response = await coachChat(input, playerId);
      output.ai = response;
    }

    // Store in memory
    await storeMemory(JSON.stringify(output), playerId);

    // Broadcast to mesh
    broadcast({
      type: 'chat_response',
      data: output
    });

    res.json(output);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// ==================== WEBSOCKET ====================

const wsClients = new Set();

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  wsClients.add(ws);

  // Send welcome
  ws.send(JSON.stringify({
    type: 'connected',
    nodeId: process.env.NODE_ID || 'node-1',
    timestamp: Date.now()
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleWSMessage(ws, message);
    } catch (e) {
      console.log('Invalid WebSocket message');
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log('🔌 WebSocket client disconnected');
  });
});

function handleWSMessage(ws, message) {
  console.log('📥 WS Message:', message.type);

  switch (message.type) {
    case 'chat':
      // Handle chat via WebSocket
      coachChat(message.input, message.playerId).then(response => {
        ws.send(JSON.stringify({
          type: 'coach_response',
          data: response
        }));
      });
      break;

    case 'game_action':
      // Process game action
      const gameState = message.gameState;
      const action = message.action;

      // Get AI decision
      const ai = getAIPlayer(message.playerId);
      ai.decideAction(gameState, message.opponentHistory).then(decision => {
        ws.send(JSON.stringify({
          type: 'ai_decision',
          data: decision
        }));
      });

      // Generate commentary
      const commentary = generateCommentary(action, gameState);
      broadcastCommentary(commentary);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;

    default:
      broadcast(message, ws);
  }
}

function broadcastCommentary(commentary) {
  const msg = JSON.stringify({
    type: 'commentary',
    data: commentary
  });

  wsClients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

// ==================== INIT ====================

async function init() {
  console.log('🌌 ONE2LVOS v5 INITIALIZING...');

  // Initialize database
  await initializeDatabase();

  // Initialize mesh
  initializeMesh();

  // Start server with error handling
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
      server.listen(PORT + 1, () => {
        console.log('');
        console.log('╔══════════════════════════════════════╗');
        console.log('║        ONE2LVOS v5 ONLINE            ║');
        console.log('╠══════════════════════════════════════╣');
        console.log(`║  🌐 API:      http://localhost:${PORT + 1}    ║`);
        console.log('║  🔌 WebSocket: ws://localhost:' + (PORT + 1) + '     ║');
        console.log('║  🧠 AI Coach:     READY              ║');
        console.log('║  📡 AI Broadcaster: READY            ║');
        console.log('║  🎮 AI Second Player: READY          ║');
        console.log('║  💾 Memory:     CONNECTED            ║');
        console.log('║  🕸️  Mesh:       ACTIVE              ║');
        console.log('╚══════════════════════════════════════╝');
        console.log('');
      });
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log('║        ONE2LVOS v5 ONLINE            ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  🌐 API:      http://localhost:${PORT}    ║`);
    console.log('║  🔌 WebSocket: ws://localhost:' + PORT + '     ║');
    console.log('║  🧠 AI Coach:     READY              ║');
    console.log('║  📡 AI Broadcaster: READY            ║');
    console.log('║  🎮 AI Second Player: READY          ║');
    console.log('║  💾 Memory:     CONNECTED            ║');
    console.log('║  🕸️  Mesh:       ACTIVE              ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('');
  });
}

init();

export default app;