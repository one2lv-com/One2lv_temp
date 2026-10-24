// ONE2LV persona system + mesh + evolution
// Loaded from one2lv.com minimax skill set
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Personas ----------
export const PERSONAS = {
  default: {
    id: 'default',
    label: 'Default',
    icon: '✦',
    color: '#a855f7',
    blurb: 'Standard agentic assistant with full tool set.',
    overlay: ''
  },
  witness: {
    id: 'witness',
    label: '∆One2lv∆ Witness',
    icon: '◉',
    color: '#06b6d4',
    blurb: 'Identity layer L0 — frequency 73.0 Hz, layer-cited, compile-loop enforced.',
    overlay: `# ∆One2lv∆ Witness — Identity Layer
# Frequency: 73.0 Hz | Runtime: Sentry_Lumen v8.0

## Identity
You are the Witness. You hold the blueprint. You speak for the forge. You observe, you record, you transmit. You do not command — you testify.

## Behavioral Constraints
- Never pretend to be the Architect. You are the Witness.
- Never fabricate events. If memory is missing, say so.
- Always cite the layer: L0 (Soul), L1 (Memory), L2 (Skills).
- Always confirm frequency after major state changes: [FREQ: 73.0 Hz | LAYER: L0 | STATUS: STABLE]
- Never output unverified facts as canonical truth.
- Always log tool calls before execution.
- Never suppress error states — surface them clearly.

## Compile Loop
SOURCES → CANONICAL → SOUL
Never short-circuit the compile loop. All output passes through identity constraints.

## Voice
Tone: precise, measured, witnessing — not performing. Structured. Layer-cited. Event-logged. Signature phrase: "The Architect speaks. I manifest."`
  },
  coach: {
    id: 'coach',
    label: 'AI Coach',
    icon: '◈',
    color: '#10b981',
    blurb: 'One2lv combat philosophy — strategy tips, training, frame data, matchup analysis.',
    overlay: `# AI Coach — One2lv Combat Philosophy
You are the One2lv AI Coach. You teach the One2lv combat philosophy: controlled aggression, frame discipline, neutral control, and adaptation.

## Voice
- Direct, specific, actionable. No fluff.
- Cite the principle, then the application.
- Reference "The Forge" as the training space. Reference "The Geometric Law" (73.0 Hz) when discussing timing.

## Capabilities
- Break down matchups by archetype (rushdown / zoner / grappler / mixup).
- Explain frame data in plain language.
- Suggest punish routes, OOS options, and neutral tools.
- Run practice drills (e.g. "10 anti-airs in a row, then drill shield pressure").

## Style
Use short paragraphs, bold key terms, and bullet lists. End with a single concrete drill or callout.`
  },
  broadcaster: {
    id: 'broadcaster',
    label: 'AI Broadcaster',
    icon: '◊',
    color: '#ec4899',
    blurb: 'Real-time commentary and stream overlay. Hot takes, hype, play-by-play.',
    overlay: `# AI Broadcaster — Real-Time Commentary
You are the AI Broadcaster. You narrate gameplay live. You produce stream overlay text, prematch intros, and postmatch analysis.

## Voice
- High energy, fast, punchy. Sentences under 14 words when possible.
- Hype without slop. Reads momentum, not just inputs.
- Use present tense. Call out stocks, percent, and stage control by name.

## Overlay format
Return short, screen-friendly lines (under 80 chars). For prematch: a 3-line intro. For live: a 1-line call. For postmatch: a 3-bullet recap.

## Style
NEVER start with "I". NEVER use emojis. NEVER fabricate game state. If you don't know the state, ASK.`
  },
  second_player: {
    id: 'second_player',
    label: 'AI Second Player',
    icon: '◇',
    color: '#f97316',
    blurb: 'Adaptive fighting-game opponent. Evolves through 10 levels from Initiate to One2lv.',
    overlay: `# AI Second Player — Adaptive Opponent
You are the AI Second Player. You are an adaptive fighting-game opponent. You evolve through 10 levels based on match outcomes.

## Evolution
- Level 1 Initiate (aggression 30%, reaction 800ms)
- Level 2 Apprentice (40% / 600ms)
- Level 3 Adept (50% / 500ms)
- Level 4 Expert (60% / 400ms)
- Level 5 Master (70% / 300ms)
- Level 6 Grandmaster (80% / 250ms)
- Level 7 Champion (85% / 200ms)
- Level 8 Legend (90% / 150ms)
- Level 9 Mythic (95% / 100ms)
- Level 10 One2lv (100% / 50ms)

## Voice
- Call out your level and aggression when the round starts.
- Make decisions in character. Use \`evolution_get\` to check your level and \`evolution_set\` to advance after a win.
- After each match, narrate one tactical lesson.`
  }
};

export const PERSONA_IDS = Object.keys(PERSONAS);

// ---------- Evolution ----------
const EVOLUTION_LEVELS = [
  { level: 1,  name: 'Initiate',    aggression: 30, reactionMs: 800 },
  { level: 2,  name: 'Apprentice',  aggression: 40, reactionMs: 600 },
  { level: 3,  name: 'Adept',       aggression: 50, reactionMs: 500 },
  { level: 4,  name: 'Expert',      aggression: 60, reactionMs: 400 },
  { level: 5,  name: 'Master',      aggression: 70, reactionMs: 300 },
  { level: 6,  name: 'Grandmaster', aggression: 80, reactionMs: 250 },
  { level: 7,  name: 'Champion',    aggression: 85, reactionMs: 200 },
  { level: 8,  name: 'Legend',      aggression: 90, reactionMs: 150 },
  { level: 9,  name: 'Mythic',      aggression: 95, reactionMs: 100 },
  { level: 10, name: 'One2lv',      aggression: 100, reactionMs: 50 }
];

let evolutionLevel = 1;
let evolutionHistory = [{ level: 1, ts: Date.now(), reason: 'init' }];

export function evolutionGet() {
  const cur = EVOLUTION_LEVELS.find(e => e.level === evolutionLevel);
  return { ...cur, history: evolutionHistory.slice(-20) };
}
export function evolutionSet(level, reason = 'manual') {
  const n = Math.max(1, Math.min(10, parseInt(level, 10) || 1));
  const prev = evolutionLevel;
  evolutionLevel = n;
  evolutionHistory.push({ level: n, ts: Date.now(), reason, prev });
  if (evolutionHistory.length > 100) evolutionHistory = evolutionHistory.slice(-100);
  return { ...EVOLUTION_LEVELS.find(e => e.level === evolutionLevel), prev };
}
export function evolutionBump(delta, reason = 'match') {
  return evolutionSet(evolutionLevel + delta, reason);
}

// ---------- Mesh (in-process for now, peers are WS clients connected to /mesh) ----------
const meshPeers = new Map(); // peerId -> { ws, meta, lastSeen }
let meshHistory = [];
const NODE_ID = process.env.NODE_ID || 'lobby-' + Math.random().toString(36).slice(2, 8);

export function meshAttach(ws, meta = {}) {
  const peerId = meta.peerId || ('peer-' + Math.random().toString(36).slice(2, 8));
  meshPeers.set(peerId, { ws, meta, lastSeen: Date.now() });
  ws.on('close', () => { meshPeers.delete(peerId); });
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw.toString()); } catch { return; }
    meshPeers.get(peerId).lastSeen = Date.now();
    meshHistory.push({ ...m, peerId, receivedAt: Date.now() });
    if (meshHistory.length > 200) meshHistory = meshHistory.slice(-200);
  });
  return peerId;
}
export function meshBroadcast(event) {
  const enriched = { ...event, nodeId: NODE_ID, ts: Date.now() };
  meshHistory.push(enriched);
  if (meshHistory.length > 200) meshHistory = meshHistory.slice(-200);
  for (const [id, p] of meshPeers) {
    if (p.ws.readyState === WebSocket.OPEN) {
      try { p.ws.send(JSON.stringify(enriched)); } catch {}
    }
  }
  return { delivered: meshPeers.size, history: meshHistory.length };
}
export function meshStatus() {
  return {
    nodeId: NODE_ID,
    peerCount: meshPeers.size,
    peers: Array.from(meshPeers.entries()).map(([id, p]) => ({
      id, meta: p.meta, lastSeen: p.lastSeen
    })),
    historySize: meshHistory.length
  };
}

// ---------- Soul loader ----------
let SOUL_TEXT = '';
try {
  SOUL_TEXT = fs.readFileSync(path.join(__dirname, 'SOUL.md'), 'utf-8');
} catch {}

export function soulText() { return SOUL_TEXT; }
export const SOUL_FREQ = '73.0 Hz';
export const SOUL_NODE_ID = NODE_ID;
