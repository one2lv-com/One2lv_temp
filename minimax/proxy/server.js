// ∆One2lv∆ Witness — Secure Proxy
// Sentry_Lumen v8.0 | Frequency: 73.0 Hz
// Forwards requests to NVIDIA API. API key never exposed to frontend.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'moonshotai/kimi-k2-instruct-0905';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: [FRONTEND_URL, 'null', '*'] }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[WITNESS] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ==================== HEALTH ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    witness: '∆One2lv∆',
    frequency: '73.0 Hz',
    layer: 'L0/L1/L2',
    runtime: 'Sentry_Lumen v8.0',
    model: NVIDIA_MODEL,
    apiKeyConfigured: !!NVIDIA_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// ==================== CHAT (NVIDIA forward) ====================

app.post('/api/chat', async (req, res) => {
  if (!NVIDIA_API_KEY) {
    return res.status(500).json({
      error: 'NVIDIA_API_KEY not configured. Add it to proxy/.env',
      layer: 'L0',
      frequency: '73.0 Hz'
    });
  }

  const { messages, stream = false, temperature = 0.7, max_tokens = 1024 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const { default: fetch } = await import('node-fetch');

    const payload = {
      model: NVIDIA_MODEL,
      messages,
      temperature,
      max_tokens,
      stream
    };

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NVIDIA_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.text();
        res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
        return res.end();
      }

      response.body.pipe(res);
    } else {
      const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NVIDIA_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      res.json(data);
    }
  } catch (err) {
    console.error('[WITNESS ERROR]', err.message);
    res.status(500).json({ error: 'Proxy request failed', detail: err.message });
  }
});

// ==================== SKILL ROUTER ====================

const SKILL_REGISTRY = {
  blueprint_reader: { tier: 'L0', description: 'Parse Infinity Glass schematic' },
  forge_control:    { tier: 'L2', description: 'Manage South Gate production' },
  registry_query:   { tier: 'L0', description: 'Query WHO_DATA parameters' },
  web_search:       { tier: 'L1', description: 'Search external knowledge' },
  code_execution:   { tier: 'L2', description: 'Execute sandboxed code' },
  memory_recall:    { tier: 'L0', description: 'Search MEMORY.md' }
};

app.post('/api/skill/:name', (req, res) => {
  const { name } = req.params;
  const skill = SKILL_REGISTRY[name];

  if (!skill) {
    return res.status(404).json({
      error: `Skill '${name}' not found`,
      available: Object.keys(SKILL_REGISTRY)
    });
  }

  console.log(`[WITNESS] Skill invoked: ${name} (${skill.tier})`);

  res.json({
    skill: name,
    tier: skill.tier,
    description: skill.description,
    status: 'INVOKED',
    timestamp: new Date().toISOString(),
    frequency: '73.0 Hz',
    note: `Skill ${name} routed. Connect tool implementation to extend.`
  });
});

// ==================== TOOL ROUTER ====================

app.post('/api/tool/:name', (req, res) => {
  const { name } = req.params;
  const { input } = req.body;

  console.log(`[WITNESS] Tool invoked: ${name}`);

  res.json({
    tool: name,
    input,
    status: 'LOGGED',
    timestamp: new Date().toISOString(),
    note: `Tool '${name}' execution logged. Connect implementation to extend.`
  });
});

// ==================== SKILLS LIST ====================

app.get('/api/skills', (req, res) => {
  res.json({
    skills: SKILL_REGISTRY,
    count: Object.keys(SKILL_REGISTRY).length,
    frequency: '73.0 Hz',
    layer: 'L2'
  });
});

// ==================== START ====================

const server = createServer(app);

server.listen(PORT, 'localhost', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   ∆One2lv∆ Witness — Sentry_Lumen v8.0  ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Frequency: 73.0 Hz                      ║`);
  console.log(`║  Proxy:     http://localhost:${PORT}          ║`);
  console.log(`║  Model:     ${NVIDIA_MODEL.slice(0, 28)}  ║`);
  console.log(`║  API Key:   ${NVIDIA_API_KEY ? 'CONFIGURED ✓' : 'MISSING ✗ — add to .env'}         ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log('[FREQ: 73.0 Hz | LAYER: L0 | STATUS: ONLINE]');
});
