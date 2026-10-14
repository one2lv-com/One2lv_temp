// Lumenis v7 — Council + Telemetry + Mesh + OBS
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { existsSync, mkdirSync } from 'fs';
import { council, send } from './council.js';
import { ingestTelemetry, comboState } from './modules/telemetry_combo_detector.js';
import { vote, result, all } from './modules/council_vote.js';
import { analyze, getSuggestion } from './modules/trainer.js';
import { predict, record } from './modules/prediction_engine.js';
import { geminiAdvice } from './modules/gemini_agent.js';
import { coach, recent as recentCoach } from './modules/voice_coach.js';
import { autoConnectOBS, isConnected, setScene } from './integrations/obs_autoconnect.js';
import { add as twitchAdd, recent as twitchRecent } from './integrations/twitch_chat.js';

const PORT = process.env.PORT || 8080;

if (!existsSync('./data')) mkdirSync('./data', { recursive: true });

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
const db = new Low(new JSONFile('./data/memory.json'), { councilLogs: [], sessions: [] });

app.use(express.json());
app.use(express.static('public'));

async function init() {
  await db.read();
  db.data ||= { councilLogs: [], sessions: [] };

  council.on('msg', async m => {
    db.data.councilLogs.push(m);
    if (db.data.councilLogs.length > 500) db.data.councilLogs.shift();
    await db.write();
    // Broadcast to all WS clients
    wsClients.forEach(ws => {
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'council_msg', data: m }));
    });
  });
}

// ── STATUS ──
app.get('/api/status', (req, res) => {
  res.json({
    system: 'Lumenis_v7',
    status: 'online',
    combo: comboState,
    obs: isConnected(),
    councilStrategy: result(),
    timestamp: new Date().toISOString()
  });
});

// ── COUNCIL ──
app.get('/api/council', async (req, res) => {
  await db.read();
  res.json(db.data.councilLogs.slice(-50));
});

app.get('/api/council/vote', (req, res) => {
  res.json({ strategy: result(), votes: all() });
});

app.post('/api/council/vote', (req, res) => {
  const { agent, strategy } = req.body;
  if (!agent || !strategy) return res.status(400).json({ error: 'agent and strategy required' });
  vote(agent, strategy);
  res.json({ ok: true, current: result() });
});

// ── TELEMETRY ──
app.post('/api/telemetry', (req, res) => {
  const combo = ingestTelemetry(req.body);
  record(req.body.type || 'unknown');
  if (req.body.type) analyze(req.body.type, req.body);
  res.json({ ok: true, combo });
});

// ── AI ──
app.get('/api/ai/advice', (req, res) => {
  res.json({
    gemini: geminiAdvice(),
    coach: getSuggestion(),
    prediction: predict(),
    recentCoach: recentCoach()
  });
});

// ── TWITCH ──
app.get('/api/twitch/chat', (req, res) => {
  res.json(twitchRecent(20));
});

app.post('/api/twitch/chat', (req, res) => {
  const { user, text } = req.body;
  if (!user || !text) return res.status(400).json({ error: 'user and text required' });
  res.json(twitchAdd(user, text));
});

// ── OBS ──
app.get('/api/obs/status', (req, res) => {
  res.json({ connected: isConnected() });
});

app.post('/api/obs/scene', async (req, res) => {
  res.json(await setScene(req.body.scene || 'Game'));
});

// ── WEBSOCKET ──
const wsClients = new Set();

wss.on('connection', ws => {
  wsClients.add(ws);
  ws.send(JSON.stringify({ type: 'connected', system: 'Lumenis_v7', timestamp: Date.now() }));

  ws.on('message', data => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'telemetry') ingestTelemetry(msg.data || {});
      if (msg.type === 'chat') twitchAdd(msg.user || 'viewer', msg.text || '');
      if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
    } catch {}
  });

  ws.on('close', () => wsClients.delete(ws));
});

init().then(() => {
  autoConnectOBS();
  send('Lumenis', 'v7 system online', { frequency: '73.0 Hz' });

  server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log('║        🌷 LUMENIS v7 ONLINE          ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  API:  http://localhost:${PORT}          ║`);
    console.log(`║  WS:   ws://localhost:${PORT}            ║`);
    console.log('╚══════════════════════════════════════╝');
  });
});
