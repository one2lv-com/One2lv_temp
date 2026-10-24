// AI Lobby — full server
// NVIDIA chat backend + agentic tool loop + file manager + terminal + scraping + vector memory
// ENFUSED with ONE2LVOS minimax: personas, mesh, evolution, soul layer
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import { WebSocketServer } from 'ws';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';
import {
  PERSONAS, PERSONA_IDS,
  evolutionGet, evolutionSet, evolutionBump,
  meshAttach, meshBroadcast, meshStatus,
  soulText, SOUL_FREQ, SOUL_NODE_ID
} from './one2lv/personas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8787;
const DATA_DIR = path.join(__dirname, 'data');
const WORKSPACE_DIR = path.join(__dirname, 'workspace');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');
const SESSIONS_PATH = path.join(DATA_DIR, 'sessions.json');
const MEMORY_PATH = path.join(DATA_DIR, 'memory.json');
const PLANS_PATH = path.join(DATA_DIR, 'plans.json');

for (const dir of [DATA_DIR, WORKSPACE_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const DEFAULTS_PATH = path.join(__dirname, 'config.defaults.json');
function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return fallback; }
}
function saveJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

if (!fs.existsSync(CONFIG_PATH)) saveJSON(CONFIG_PATH, loadJSON(DEFAULTS_PATH, {}));
if (!fs.existsSync(SETTINGS_PATH)) saveJSON(SETTINGS_PATH, { showApiKeys: false, theme: 'aurora', voiceOverlay: true });
if (!fs.existsSync(SESSIONS_PATH)) saveJSON(SESSIONS_PATH, {});
if (!fs.existsSync(MEMORY_PATH)) saveJSON(MEMORY_PATH, { items: [] });
if (!fs.existsSync(PLANS_PATH)) saveJSON(PLANS_PATH, { plans: [] });

const config = loadJSON(CONFIG_PATH, {});
const settings = loadJSON(SETTINGS_PATH, {});
const state = {
  persona: settings.persona || 'default',
  freq: SOUL_FREQ
};
const sessions = loadJSON(SESSIONS_PATH, {});
let memory = loadJSON(MEMORY_PATH, { items: [] });
let plans = loadJSON(PLANS_PATH, { plans: [] });

function persistMemory() { saveJSON(MEMORY_PATH, memory); }
function persistPlans() { saveJSON(PLANS_PATH, plans); }
function persistSettings() { saveJSON(SETTINGS_PATH, settings); }
function persistState() { settings.persona = state.persona; persistSettings(); }
function persistConfig() { saveJSON(CONFIG_PATH, config); }
function persistSessions() { saveJSON(SESSIONS_PATH, sessions); }

// ---------- Auth ----------
const ADMIN_USER = config.admin.username;
const ADMIN_PASS = config.admin.password;
const SESSION_COOKIE = 'lobby_sid';

function makeSession(user) {
  const sid = crypto.randomBytes(24).toString('hex');
  sessions[sid] = { user, ts: Date.now() };
  persistSessions();
  return sid;
}
function getSession(req) {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (!sid || !sessions[sid]) return null;
  // Touch timestamp
  sessions[sid].ts = Date.now();
  return sessions[sid];
}
function requireAdmin(req, res, next) {
  const s = getSession(req);
  if (!s || s.user !== ADMIN_USER) return res.status(401).json({ error: 'admin auth required' });
  next();
}
function adminFromRequest(req) {
  const s = getSession(req);
  return !!(s && s.user === ADMIN_USER);
}

// ---------- Vector memory (hashed bag-of-words + IDF) ----------
const STOPWORDS = new Set(("a an the and or of in on at to for from is are was were be been being it this that those these as by with about into over under up down out off not no nor so if then than too very can could should would may might will shall do does did doing have has had having i you he she we they me him her us them my your his their our its").split(/\s+/));
function tokenize(text) {
  return (text || '').toLowerCase().match(/[a-z0-9]{2,}/g)?.filter(t => !STOPWORDS.has(t)) || [];
}
function hashEmbed(token, dim) {
  const h = crypto.createHash('sha1').update(token).digest();
  const v = new Float32Array(dim);
  for (let i = 0; i < 4; i++) {
    const idx = ((h[i*2] << 8) | h[i*2+1]) % dim;
    v[idx] += 1;
  }
  // sign
  for (let i = 0; i < 4; i++) {
    const idx = ((h[8 + i*2] << 8) | h[8 + i*2+1]) % dim;
    v[idx] *= (h[16 + i] & 1) ? 1 : -1;
  }
  return v;
}
function textVector(text, dim) {
  const toks = tokenize(text);
  const v = new Float32Array(dim);
  for (const t of toks) {
    const e = hashEmbed(t, dim);
    for (let i = 0; i < dim; i++) v[i] += e[i];
  }
  // normalize
  let n = 0; for (let i = 0; i < dim; i++) n += v[i]*v[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < dim; i++) v[i] /= n;
  return v;
}
function cosine(a, b) {
  let s = 0; const dim = Math.min(a.length, b.length);
  for (let i = 0; i < dim; i++) s += a[i]*b[i];
  return s;
}
function memoryStore({ text, tag }) {
  const dim = config.memory?.embeddingDim || 384;
  const item = {
    id: crypto.randomBytes(8).toString('hex'),
    text,
    tag: tag || 'general',
    vec: Array.from(textVector(text, dim)),
    ts: Date.now()
  };
  memory.items.push(item);
  // cap to last 5000
  if (memory.items.length > 5000) memory.items = memory.items.slice(-5000);
  persistMemory();
  return { ok: true, id: item.id, count: memory.items.length };
}
function memoryRecall({ query, k = 5 }) {
  const dim = config.memory?.embeddingDim || 384;
  const qv = textVector(query || '', dim);
  const scored = memory.items.map(m => ({ m, s: cosine(qv, m.vec) }));
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, k).filter(x => x.s > 0).map(x => ({
    id: x.m.id, text: x.m.text, tag: x.m.tag, ts: x.m.ts, score: x.s
  }));
}

// ---------- Tools ----------
const SAFE_PATH = (p) => {
  const resolved = path.resolve(WORKSPACE_DIR, '.' + (p || ''));
  if (!resolved.startsWith(WORKSPACE_DIR)) throw new Error('path escapes workspace');
  return resolved;
};

const TOOLS = {
  persona_set({ name }) {
    if (!PERSONA_IDS.includes(name)) return { error: `unknown persona: ${name}. valid: ${PERSONA_IDS.join(', ')}` };
    state.persona = name;
    persistSettings();
    return { ok: true, persona: name, label: PERSONAS[name].label };
  },
  evolution_get() { return { ok: true, ...evolutionGet() }; },
  evolution_set({ level, reason }) { return { ok: true, ...evolutionSet(level, reason) }; },
  evolution_bump({ delta, reason }) { return { ok: true, ...evolutionBump(delta, reason) }; },
  mesh_status() { return { ok: true, ...meshStatus() }; },
  mesh_broadcast({ type, data }) {
    return { ok: true, ...meshBroadcast({ type: type || 'lobby_event', data: data || {} }) };
  },
  async web_scrape({ url }) {
    if (!/^https?:\/\//i.test(url)) return { error: 'url must be http(s)' };
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 AI-Lobby' }, redirect: 'follow' });
    const ct = res.headers.get('content-type') || '';
    const body = await res.text();
    let text = body;
    if (ct.includes('html')) {
      text = body
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ').trim();
    }
    return { ok: true, status: res.status, contentType: ct, text: text.slice(0, 20000), length: text.length };
  },
  async web_search({ query }) {
    // Use DuckDuckGo HTML lite (no key)
    const url = 'https://duckduckgo.com/html/?q=' + encodeURIComponent(query);
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 AI-Lobby' } });
      const html = await res.text();
      const results = [];
      const re = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      let m;
      while ((m = re.exec(html)) && results.length < 8) {
        results.push({ title: m[2].replace(/<[^>]+>/g, '').trim(), url: m[1], snippet: m[3].replace(/<[^>]+>/g, '').trim() });
      }
      return { ok: true, results };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
  async file_read({ path: p }) {
    const fp = SAFE_PATH(p);
    const stat = await fsp.stat(fp);
    if (!stat.isFile()) return { error: 'not a file' };
    const buf = await fsp.readFile(fp);
    return { ok: true, size: stat.size, content: buf.toString('utf-8').slice(0, 200000) };
  },
  async file_write({ path: p, content }) {
    const fp = SAFE_PATH(p);
    await fsp.mkdir(path.dirname(fp), { recursive: true });
    await fsp.writeFile(fp, content ?? '', 'utf-8');
    return { ok: true, path: p, bytes: Buffer.byteLength(content || '') };
  },
  async file_list({ path: p }) {
    const fp = SAFE_PATH(p || '/');
    const entries = await fsp.readdir(fp, { withFileTypes: true });
    const items = [];
    for (const e of entries) {
      const full = path.join(fp, e.name);
      let size = 0;
      try { size = (await fsp.stat(full)).size; } catch {}
      items.push({ name: e.name, type: e.isDirectory() ? 'dir' : 'file', size });
    }
    return { ok: true, path: p || '/', items };
  },
  async terminal_run({ command }) {
    return await new Promise((resolve) => {
      const cwd = WORKSPACE_DIR;
      const child = exec(command, { cwd, timeout: 30000, maxBuffer: 1024 * 1024, shell: '/bin/bash' }, (err, stdout, stderr) => {
        resolve({
          ok: !err,
          code: err?.code ?? 0,
          stdout: (stdout || '').toString().slice(0, 200000),
          stderr: (stderr || '').toString().slice(0, 200000)
        });
      });
    });
  },
  memory_store({ text, tag }) { return memoryStore({ text, tag }); },
  memory_recall({ query, k }) { return { ok: true, items: memoryRecall({ query, k }) }; },
  voice_speak({ text }) { return { ok: true, queued: true, text }; },
  skill_list() { return { ok: true, skills: SKILL_CATALOG }; },
  plan_task({ goal, steps }) {
    const plan = { id: crypto.randomBytes(6).toString('hex'), goal, steps, ts: Date.now(), status: 'active' };
    plans.plans.unshift(plan);
    if (plans.plans.length > 200) plans.plans = plans.plans.slice(0, 200);
    persistPlans();
    return { ok: true, plan };
  }
};

const SKILL_CATALOG = [
  { id: 'web_scrape', label: 'Web Scrape', desc: 'Fetch any URL and return clean text', icon: 'globe', admin: false },
  { id: 'web_search', label: 'Web Search', desc: 'Search the open web via DuckDuckGo', icon: 'search', admin: false },
  { id: 'memory_store', label: 'Save Memory', desc: 'Persist a fact to vector memory', icon: 'brain', admin: false },
  { id: 'memory_recall', label: 'Recall Memory', desc: 'Search past memories by similarity', icon: 'sparkles', admin: false },
  { id: 'voice_speak', label: 'Voice Reply', desc: 'Speak the response aloud (TTS overlay)', icon: 'mic', admin: false },
  { id: 'plan_task', label: 'Plan Task', desc: 'Outline a multi-step plan and track it', icon: 'list', admin: false },
  { id: 'skill_list', label: 'List Skills', desc: 'Show all available agent skills', icon: 'grid', admin: false },
  { id: 'file_read', label: 'Read File', desc: 'Read a file from the workspace', icon: 'file', admin: true },
  { id: 'file_write', label: 'Write File', desc: 'Create or overwrite a file', icon: 'pencil', admin: true },
  { id: 'file_list', label: 'List Files', desc: 'List a workspace directory', icon: 'folder', admin: true },
  { id: 'terminal_run', label: 'Run Command', desc: 'Execute a shell command in the workspace', icon: 'terminal', admin: true }
];

// ---------- NVIDIA chat client with tool loop ----------
async function nvidiaChatStream({ modelCfg, messages, onDelta, signal, maxSteps = 6 }) {
  const transcript = []; // collected tool traces for the caller
  let step = 0;
  let pending = [...messages];
  let finalText = '';
  while (step < maxSteps) {
    step++;
    const body = {
      model: modelCfg.model,
      messages: pending,
      temperature: modelCfg.temperature ?? 0.6,
      top_p: modelCfg.top_p ?? 0.9,
      max_tokens: modelCfg.max_tokens ?? 4096,
      stream: modelCfg.stream !== false
    };
    if (modelCfg.extraBody && typeof modelCfg.extraBody === 'object') {
      Object.assign(body, modelCfg.extraBody);
    }
    const res = await fetch(modelCfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': body.stream ? 'text/event-stream' : 'application/json',
        'Authorization': 'Bearer ' + modelCfg.apiKey
      },
      body: JSON.stringify(body),
      signal
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`NVIDIA ${res.status}: ${errText.slice(0, 500)}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantText = '';
    let aborted = false;
    let sawReasoning = false;
    while (!aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const payload = t.slice(5).trim();
        if (payload === '[DONE]') { aborted = true; break; }
        try {
          const obj = JSON.parse(payload);
          const choice = obj.choices?.[0];
          if (!choice) continue;
          const delta = choice.delta || {};
          // Reasoning models put output in reasoning_content before content.
          // Surface a brief "thinking" cue to the UI but don't stream CoT.
          if (delta.reasoning_content && !sawReasoning) {
            sawReasoning = true;
            onDelta?.('🧠 *thinking…*\n\n', { step, tool: null, meta: 'thinking' });
          }
          const content = delta.content || '';
          if (content) {
            assistantText += content;
            onDelta?.(content, { step, tool: null });
          }
        } catch {}
      }
    }
    finalText = assistantText;
    pending.push({ role: 'assistant', content: assistantText });

    // Detect tool calls
    const toolCalls = [];
    const toolRe = /\[\[TOOL:([a-zA-Z0-9_]+)\|([\s\S]*?)\]\]/g;
    let m;
    while ((m = toolRe.exec(assistantText)) !== null) {
      const name = m[1];
      let args = {};
      try { args = JSON.parse(m[2]); } catch { args = { raw: m[2] }; }
      toolCalls.push({ name, args });
    }
    if (toolCalls.length === 0) break;

    // Execute tools
    for (const tc of toolCalls) {
      const fn = TOOLS[tc.name];
      let result;
      try {
        result = fn ? await fn(tc.args) : { error: `unknown tool: ${tc.name}` };
      } catch (e) {
        result = { error: String(e.message || e) };
      }
      transcript.push({ step, tool: tc.name, args: tc.args, result });
      onDelta?.(`\n\n*[tool: ${tc.name}]*\n`, { step, tool: tc.name });
      pending.push({ role: 'user', content: `Tool result for ${tc.name} (args=${JSON.stringify(tc.args)}):\n${JSON.stringify(result).slice(0, 50000)}` });
    }
  }
  return { text: finalText, transcript };
}

// ---------- App ----------
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Public endpoints
app.get('/api/whoami', (req, res) => {
  const s = getSession(req);
  res.json({
    user: s?.user || null,
    isAdmin: adminFromRequest(req),
    persona: state.persona,
    nodeId: SOUL_NODE_ID,
    freq: SOUL_FREQ
  });
});

app.get('/api/models', (req, res) => {
  // Don't expose API keys publicly
  res.json(config.models.map(m => ({
    id: m.id, label: m.label, model: m.model, color: m.color
  })));
});

app.get('/api/skills', (req, res) => {
  res.json(SKILL_CATALOG.map(s => ({ ...s, available: !s.admin || adminFromRequest(req) })));
});

app.get('/api/memory', (req, res) => {
  const items = memory.items.slice(-100).reverse().map(m => ({ id: m.id, text: m.text, tag: m.tag, ts: m.ts }));
  res.json({ items, total: memory.items.length });
});

app.get('/api/plans', (req, res) => { res.json(plans); });

// Settings (public read of safe subset, admin write)
app.get('/api/settings', (req, res) => {
  res.json({
    showApiKeys: settings.showApiKeys,
    theme: settings.theme,
    voiceOverlay: settings.voiceOverlay,
    isAdmin: adminFromRequest(req)
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const sid = makeSession(username);
    res.cookie(SESSION_COOKIE, sid, { httpOnly: true, sameSite: 'lax', path: '/' });
    return res.json({ ok: true, user: username, isAdmin: true });
  }
  res.status(401).json({ ok: false, error: 'invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (sid) { delete sessions[sid]; persistSessions(); }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.post('/api/clear-history', (req, res) => {
  // Wipe conversation buffers (kept in WS only) — this endpoint wipes memory
  memory = { items: [] };
  persistMemory();
  res.json({ ok: true });
});

// Admin: full settings incl. API keys
app.get('/api/admin/config', requireAdmin, (req, res) => {
  res.json(config);
});

app.post('/api/admin/config', requireAdmin, (req, res) => {
  const next = req.body || {};
  // shallow merge
  if (Array.isArray(next.models)) config.models = next.models;
  if (typeof next.systemPrompt === 'string') config.systemPrompt = next.systemPrompt;
  if (next.tts) config.tts = { ...config.tts, ...next.tts };
  if (next.memory) config.memory = { ...config.memory, ...next.memory };
  if (next.admin) config.admin = next.admin;
  persistConfig();
  res.json({ ok: true });
});

app.post('/api/admin/settings', requireAdmin, (req, res) => {
  const next = req.body || {};
  if (typeof next.showApiKeys === 'boolean') settings.showApiKeys = next.showApiKeys;
  if (typeof next.theme === 'string') settings.theme = next.theme;
  if (typeof next.voiceOverlay === 'boolean') settings.voiceOverlay = next.voiceOverlay;
  persistSettings();
  res.json({ ok: true });
});

// Public: persona info + switch
app.get('/api/personas', (req, res) => {
  res.json({ personas: PERSONAS, active: state.persona, freq: SOUL_FREQ, nodeId: SOUL_NODE_ID, soul: soulText() });
});
app.post('/api/personas/select', (req, res) => {
  const { name } = req.body || {};
  if (!PERSONA_IDS.includes(name)) return res.status(400).json({ error: 'unknown persona' });
  state.persona = name;
  persistState();
  res.json({ ok: true, active: name });
});

// Evolution
app.get('/api/evolution', (req, res) => res.json(evolutionGet()));
app.post('/api/evolution', (req, res) => {
  const { level, reason } = req.body || {};
  res.json(evolutionSet(level, reason));
});
app.post('/api/evolution/bump', (req, res) => {
  const { delta, reason } = req.body || {};
  res.json(evolutionBump(delta ?? 1, reason));
});

// Mesh
app.get('/api/mesh', (req, res) => res.json(meshStatus()));
app.post('/api/mesh/broadcast', (req, res) => {
  const { type, data } = req.body || {};
  res.json(meshBroadcast({ type: type || 'lobby_event', data: data || {} }));
});

// File manager (admin)
app.get('/api/files', requireAdmin, async (req, res) => {
  try {
    const p = req.query.path || '/';
    const fp = SAFE_PATH(p);
    const entries = await fsp.readdir(fp, { withFileTypes: true });
    const items = await Promise.all(entries.map(async (e) => {
      const full = path.join(fp, e.name);
      let size = 0; let mtime = 0;
      try { const s = await fsp.stat(full); size = s.size; mtime = s.mtimeMs; } catch {}
      return { name: e.name, type: e.isDirectory() ? 'dir' : 'file', size, mtime };
    }));
    items.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
    res.json({ ok: true, path: p, items });
  } catch (e) { res.status(400).json({ ok: false, error: String(e.message) }); }
});

app.get('/api/files/read', requireAdmin, async (req, res) => {
  try {
    const p = req.query.path;
    const fp = SAFE_PATH(p);
    const stat = await fsp.stat(fp);
    if (!stat.isFile()) return res.status(400).json({ error: 'not a file' });
    const buf = await fsp.readFile(fp);
    res.json({ ok: true, path: p, size: stat.size, content: buf.toString('utf-8').slice(0, 500000) });
  } catch (e) { res.status(400).json({ ok: false, error: String(e.message) }); }
});

app.post('/api/files/write', requireAdmin, async (req, res) => {
  try {
    const { path: p, content } = req.body || {};
    const fp = SAFE_PATH(p);
    await fsp.mkdir(path.dirname(fp), { recursive: true });
    await fsp.writeFile(fp, content ?? '', 'utf-8');
    res.json({ ok: true, path: p });
  } catch (e) { res.status(400).json({ ok: false, error: String(e.message) }); }
});

app.post('/api/files/mkdir', requireAdmin, async (req, res) => {
  try {
    const { path: p } = req.body || {};
    const fp = SAFE_PATH(p);
    await fsp.mkdir(fp, { recursive: true });
    res.json({ ok: true, path: p });
  } catch (e) { res.status(400).json({ ok: false, error: String(e.message) }); }
});

app.post('/api/files/rename', requireAdmin, async (req, res) => {
  try {
    const { path: p, newName } = req.body || {};
    const fp = SAFE_PATH(p);
    const np = path.join(path.dirname(fp), path.basename(newName || ''));
    if (!np.startsWith(WORKSPACE_DIR)) return res.status(400).json({ error: 'bad name' });
    await fsp.rename(fp, np);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ ok: false, error: String(e.message) }); }
});

app.post('/api/files/delete', requireAdmin, async (req, res) => {
  try {
    const { path: p } = req.body || {};
    const fp = SAFE_PATH(p);
    await fsp.rm(fp, { recursive: true, force: true });
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ ok: false, error: String(e.message) }); }
});

app.post('/api/files/upload', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const p = req.body.path || '/';
    const fp = SAFE_PATH(p);
    await fsp.mkdir(fp, { recursive: true });
    const dest = path.join(fp, req.file.originalname);
    await fsp.writeFile(dest, req.file.buffer);
    res.json({ ok: true, name: req.file.originalname, size: req.file.size });
  } catch (e) { res.status(400).json({ ok: false, error: String(e.message) }); }
});

app.get('/api/files/download', requireAdmin, async (req, res) => {
  try {
    const p = req.query.path;
    const fp = SAFE_PATH(p);
    res.download(fp, path.basename(fp));
  } catch (e) { res.status(400).json({ ok: false, error: String(e.message) }); }
});

// Terminal (admin)
app.post('/api/terminal', requireAdmin, async (req, res) => {
  const { command } = req.body || {};
  if (typeof command !== 'string' || !command.trim()) return res.status(400).json({ error: 'empty command' });
  exec(command, { cwd: WORKSPACE_DIR, timeout: 30000, maxBuffer: 1024 * 1024, shell: '/bin/bash' }, (err, stdout, stderr) => {
    res.json({
      ok: !err,
      code: err?.code ?? 0,
      stdout: (stdout || '').toString().slice(0, 200000),
      stderr: (stderr || '').toString().slice(0, 200000)
    });
  });
});

app.get('/api/system', (req, res) => {
  res.json({
    node: process.version,
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: { total: os.totalmem(), free: os.freemem() },
    uptime: os.uptime(),
    workspace: WORKSPACE_DIR
  });
});

// ---------- WebSocket: chat stream ----------
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const meshWss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const url = req.url || '';
  if (url === '/ws' || url.startsWith('/ws?')) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  } else if (url === '/mesh' || url.startsWith('/mesh?')) {
    meshWss.handleUpgrade(req, socket, head, (ws) => meshWss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'hello', t: Date.now() }));
  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.type === 'chat') {
      const { modelId, messages, voice } = msg;
      const modelCfg = config.models.find(m => m.id === modelId) || config.models[0];
      // Build prompt: prepend system + persona overlay + recall relevant memories
      const userText = messages[messages.length - 1]?.content || '';
      const recalled = memoryRecall({ query: userText, k: 4 });
      const memoryBlock = recalled.length
        ? `\n\n[Recalled memories that may help]\n` + recalled.map(r => `- (${r.tag}) ${r.text}`).join('\n')
        : '';
      const persona = PERSONAS[state.persona] || PERSONAS.default;
      const personaBlock = persona.overlay ? `\n\n## ACTIVE PERSONA: ${persona.label}\n${persona.overlay}\n` : '';
      const evo = evolutionGet();
      const evoBlock = state.persona === 'second_player'
        ? `\n\n[Current evolution level: ${evo.level} — ${evo.name}, aggression=${evo.aggression}%, reaction=${evo.reactionMs}ms]`
        : '';
      const fullMessages = [
        { role: 'system', content: (config.systemPrompt || '') + personaBlock + evoBlock + memoryBlock },
        ...messages
      ];
      const ac = new AbortController();
      ws._abort = ac;
      try {
        const out = await nvidiaChatStream({
          modelCfg,
          messages: fullMessages,
          signal: ac.signal,
          onDelta: (delta, meta) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: 'delta', delta, meta }));
              if (delta && voice) {
                // schedule TTS cue for the final chunk
                ws.send(JSON.stringify({ type: 'tts_cue', text: delta }));
              }
            }
          }
        });
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'done', transcript: out.transcript, text: out.text }));
        }
        // Auto-remember assistant turn if it's a memorable fact-like reply
        if (out.text && out.text.length < 600 && /^(note|remember|fact)/i.test(userText)) {
          memoryStore({ text: out.text, tag: 'auto' });
        }
      } catch (e) {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'error', error: String(e.message || e) }));
        }
      }
    } else if (msg.type === 'abort') {
      ws._abort?.abort();
    } else if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', t: Date.now() }));
    } else if (msg.type === 'persona') {
      if (PERSONA_IDS.includes(msg.name)) {
        state.persona = msg.name;
        persistState();
        ws.send(JSON.stringify({ type: 'persona', name: msg.name, label: PERSONAS[msg.name].label }));
      }
    }
  });
});

// Mesh WS — external peers connect here to join the lobby's mesh network
meshWss.on('connection', (ws, req) => {
  const meta = { ip: req.socket.remoteAddress, ua: req.headers['user-agent'] };
  const peerId = meshAttach(ws, meta);
  ws.send(JSON.stringify({ type: 'hello', peerId, nodeId: SOUL_NODE_ID, freq: SOUL_FREQ }));
});

server.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║          AI LOBBY is live                ║`);
  console.log(`  ║   http://localhost:${PORT}                  ║`);
  console.log(`  ║   Admin → ${ADMIN_USER} / ${ADMIN_PASS}        ║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});
