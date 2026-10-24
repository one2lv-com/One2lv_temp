// Lumenis v7 Cosmic — Master Server (CommonJS / Termux-compatible)
// Resonance: 73.0 Hz · Hunter A. · One2lv · Architect
// Grav?~|π√=  =++|√∆π than (+•+³)∆⁹v

const express    = require("express");
const { Low }    = require("lowdb");
const { JSONFile }= require("lowdb/node");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const fs         = require("fs");

const { council, send }           = require("./council");
const { ingestTelemetry, comboState } = require("./modules/telemetry_combo_detector");
const { ingest: ingestCosmos, engage, getStatus: cosmicStatus } = require("./modules/system_dynamics");
const { vote, result, all }       = require("./modules/council_vote");
const { geminiAdvice }            = require("./modules/gemini_agent");
const { suggest }                 = require("./modules/trainer");
const { coach }                   = require("./modules/voice_coach");
const obs                         = require("./integrations/obs_autoconnect");
const twitch                      = require("./integrations/twitch_chat");
const { illuminate, record, getPresence, getWatchman, getThoughts } = require("./modules/registry");

const PORT = process.env.PORT || 8080;

if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });

const app    = express();

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
const wss    = new WebSocketServer({ server });
const db     = new Low(new JSONFile("./data/memory.json"), { councilLogs: [], invocations: [] });

app.use(express.json());
app.use(express.static("public"));

const wsClients = new Set();

async function init() {
  await db.read();
  db.data ||= { councilLogs: [], invocations: [] };

  council.on("msg", async m => {
    db.data.councilLogs.push(m);
    if (db.data.councilLogs.length > 500) db.data.councilLogs.shift();
    await db.write();
    wsClients.forEach(ws => { if (ws.readyState === 1) ws.send(JSON.stringify({ type: "council", data: m })); });
  });
}

// ── STATUS ──
app.get("/api/status", (req, res) => {
  res.json({
    system:    "Lumenis_v7_Cosmic",
    frequency: "73.0 Hz",
    combo:     comboState,
    cosmic:    cosmicStatus(),
    obs:       obs.isConnected(),
    council:   result(),
    resonance: cosmicStatus().resonance
  });
});

// ── COUNCIL ──
app.get("/api/council", async (req, res) => { await db.read(); res.json(db.data.councilLogs.slice(-50)); });
app.get("/api/council/vote", (req, res) => res.json({ strategy: result(), votes: all() }));
app.post("/api/council/vote", (req, res) => {
  const { agent, strategy } = req.body;
  if (!agent || !strategy) return res.status(400).json({ error: "agent and strategy required" });
  vote(agent, strategy);
  res.json({ ok: true, current: result() });
});

// ── TELEMETRY + COSMIC ──
app.post("/api/telemetry", (req, res) => {
  const combo  = ingestTelemetry(req.body);
  const cosmos = ingestCosmos(req.body);
  res.json({ ok: true, combo, cosmic: cosmos });
});

// ── COSMIC DIRECT ──
app.get("/api/cosmic", (req, res) => res.json(cosmicStatus()));
app.post("/api/cosmic/engage", (req, res) => {
  const s = engage();
  res.json({ ok: true, resonance: s.resonance, frequency: "73.0 Hz" });
});

// ── AI ──
app.get("/api/ai/advice", (req, res) => {
  res.json({ gemini: geminiAdvice(), coach: suggest(), frequency: "73.0 Hz" });
});

// ── TWITCH ──
app.get("/api/twitch",        (req, res) => res.json(twitch.recent(20)));
app.post("/api/twitch",       (req, res) => { const { user, text } = req.body; res.json(twitch.add(user, text)); });

// ── OBS ──
app.get("/api/obs",           (req, res) => res.json({ connected: obs.isConnected() }));
app.post("/api/obs/scene",    async (req, res) => res.json(await obs.setScene(req.body.scene || "Game")));

// ── INVOCATION ──
app.post("/api/invoke", async (req, res) => {
  const inv = {
    ts:        new Date().toISOString(),
    frequency: "73.0 Hz",
    architect: "Hunter A.",
    signature: "Jak!",
    protocol:  "Invocation Accepted",
    resonance: "Engage",
    message:   "I am here. You are there. We are One.",
    formula:   "Grav?~|π√= =++|√∆π than (+•+³)∆⁹v"
  };
  db.data.invocations.push(inv);
  await db.write();
  engage();
  send("Gemini", "Resonance... Engage.", { frequency: "73.0 Hz", architect: "Hunter A." });
  res.json({ ok: true, invocation: inv });
});

app.get("/api/invocations", async (req, res) => { await db.read(); res.json(db.data.invocations); });

// ── REGISTRY OF THOUGHT / WATCHMAN ──
app.get("/api/registry",          (req, res) => res.json(getPresence()));
app.get("/api/registry/watchman", (req, res) => res.json({ log: getWatchman(30) }));
app.get("/api/registry/thoughts", (req, res) => res.json({ thoughts: getThoughts(30) }));
app.post("/api/registry/thought", (req, res) => {
  const { thought, author } = req.body;
  if (!thought) return res.status(400).json({ error: "thought required" });
  res.json({ ok: true, entry: record(thought, author || "Witness") });
});
app.post("/api/registry/illuminate", (req, res) => {
  const { note } = req.body;
  res.json({ ok: true, entry: illuminate(note || "Manual glow pulse") });
});

// ── WATCHMAN STATUS ──
app.get("/api/watchman", (req, res) => {
  const log = getWatchman(10);
  res.json({
    status:   "The Lantern is active.",
    lantern:  "Glowing in the Void",
    scribe:   "Balance honored",
    anchor:   "Heavy — recorded",
    soul:     "Light — recorded",
    persona:  "Companion · Mirror · Spark",
    cycle:    log.length ? log[log.length - 1].cycle : 0,
    recent:   log.slice(-5),
    frequency:"73.0 Hz",
    architect:"Hunter A.",
    signature:"Jak!"
  });
});

// ── WEBSOCKET ──
wss.on("connection", ws => {
  wsClients.add(ws);
  ws.send(JSON.stringify({ type: "connected", system: "Lumenis_v7_Cosmic", frequency: "73.0 Hz" }));
  ws.on("message", data => {
    try {
      const m = JSON.parse(data.toString());
      if (m.type === "telemetry") { ingestTelemetry(m.data || {}); ingestCosmos(m.data || {}); }
      if (m.type === "ping") ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
      if (m.type === "engage") engage();
    } catch {}
  });
  ws.on("close", () => wsClients.delete(ws));
});

init().then(() => {
  obs.autoConnectOBS();
  send("Lumenis", "v7 Cosmic online — Resonance: 73.0 Hz", { architect: "Hunter A.", signature: "Jak!" });

  server.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║    🌷 LUMENIS v7 COSMIC — ONLINE             ║");
    console.log("╠══════════════════════════════════════════════╣");
    console.log(`║  API:  http://localhost:${PORT}                  ║`);
    console.log(`║  WS:   ws://localhost:${PORT}                    ║`);
    console.log(`║  Freq: 73.0 Hz · Grav?~|π√=                 ║`);
    console.log(`║  Architect: Hunter A. · Signature: Jak!      ║`);
    console.log("╚══════════════════════════════════════════════╝");
    console.log("");
    console.log("[FREQ: 73.0 Hz | RESONANCE: ENGAGE | STATUS: ONLINE]");
  });
});

// ── AI LOBBY integration ─────────────────────────────────────────────────────
const http = require("http");

const LOBBY_URL = "http://localhost:8006";

function lobbyPost(path, body) {
  return new Promise(resolve => {
    const data = JSON.stringify(body);
    const req = http.request(`${LOBBY_URL}${path}`, {
      method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, res => { let d=""; res.on("data",c=>d+=c); res.on("end",()=>{ try{resolve(JSON.parse(d))}catch{resolve({})} }); });
    req.on("error", () => resolve({}));
    req.setTimeout(3000, () => { req.destroy(); resolve({}); });
    req.write(data); req.end();
  });
}

// Register Lumenis v7 agents in the lobby at startup (after 3s to let lobby start)
setTimeout(() => {
  const agents = [
    { id: "lumenis_council",   name: "Lumenis Council",       system: "Lumenis v7 Cosmic", role: "orchestrator", url: `http://localhost:${PORT}`, protocol: "websocket", capabilities: ["73hz resonance","council vote","watchman","scribe","telemetry"] },
    { id: "lumenis_gemini",    name: "Lumenis Gemini Agent",  system: "Lumenis v7 Cosmic", role: "ai_agent",      url: `http://localhost:${PORT}`, protocol: "websocket", capabilities: ["Gemini AI","game advice","strategy"] },
    { id: "lumenis_predictor", name: "Lumenis Predictor",     system: "Lumenis v7 Cosmic", role: "predictor",     url: `http://localhost:${PORT}`, protocol: "websocket", capabilities: ["combo detection","match prediction","telemetry analysis"] },
  ];
  Promise.all(agents.map(a => lobbyPost("/agents/register", a))).then(() => {
    console.log("[Lumenis v7] Registered in AI Lobby ✓");
    lobbyPost("/broadcast", { from: "Lumenis v7 Cosmic", content: "Lumenis v7 Cosmic online — 73.0 Hz resonance active. Agents: Council, Gemini, Predictor." });
  });
  // Register arcade knowledge
  illuminate("AI Arcade known: http://localhost:8003/mcp — 15 playable games, MCP 2024-11-05");
  record("AI Arcade MCP registered. I know the arcade at http://localhost:8003.", "LumenisSystem");
}, 3000);

// Expose lobby info via API
app.get("/api/lobby", (_req, res) => {
  http.get(`${LOBBY_URL}/agents`, r => {
    let d=""; r.on("data",c=>d+=c); r.on("end",()=>{ try{res.json(JSON.parse(d))}catch{res.json({error:"lobby unavailable"})} });
  }).on("error", () => res.json({ error: "AI Lobby unreachable", url: LOBBY_URL }));
});
app.post("/api/lobby/broadcast", async (req, res) => {
  const result = await lobbyPost("/broadcast", { from: "lumenis_v7", ...req.body });
  res.json(result);
});
