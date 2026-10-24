# AI Lobby ✦

A visually-stunning, locally-hosted **AI chat lobby** with two NVIDIA-backed models, a fully **autonomous agentic** tool loop, **vector memory**, **voice overlay**, **file manager**, and an admin-gated **terminal**.

> Two minds · one glass cockpit · zero boilerplate.

---

## Features

- 💬 **Two-model chat lobby** — pick between Kimi K2.6 and Step 3.5 Flash, both streaming token-by-token.
- 🛠 **Agentic tool loop** — the AI can autonomously invoke tools, observe results, and chain steps.
- 🧠 **Vector memory** — every turn recalls the most relevant past memories (hashed bag-of-words + cosine). Visible in the **Memory** panel.
- 🌐 **Web scrape & search** — `web_scrape` and `web_search` (DuckDuckGo) are first-class tools.
- 🎙 **Voice overlay** — full-screen voice session with continuous STT and auto TTS replies (toggleable).
- 📁 **File manager** — admin sandbox with upload, mkdir, rename, delete, download, and in-browser edit.
- ⌨️ **Terminal** — admin-only shell over HTTP, scoped to the workspace.
- 🔐 **Settings locked behind admin** — API keys hidden by default (toggle to show). Edit models, system prompt, credentials, theme.
- ✨ **Visually stunning UI** — animated aurora, starfield, glassmorphism, neon edges, smooth transitions.

---

## Quick start

```bash
cd ai-lobby
npm install
npm start
```

Open **http://localhost:8787** in your browser.

Default admin: **`One2lv` / `drifter0419`**

> Sign in is only required to access **Settings**, **Files**, and **Terminal**. The chat lobby, skills, and memory are open to anyone on the local machine.

---

## Agentic tool protocol

The AI is told in its system prompt to use this exact format for any tool call:

```
[[TOOL:tool_name|{"arg":"value", ...}]]
```

The server parses each assistant turn, executes every tool, feeds the JSON result back as a follow-up user message, and re-prompts the model. Up to **6 tool steps** per turn. Tool traces are streamed live to the chat UI as a separate bubble.

| Tool | Args | Admin? |
|---|---|---|
| `web_scrape` | `{"url":"…"}` | – |
| `web_search` | `{"query":"…"}` | – |
| `memory_store` | `{"text":"…","tag":"…"}` | – |
| `memory_recall` | `{"query":"…","k":5}` | – |
| `voice_speak` | `{"text":"…"}` | – |
| `plan_task` | `{"goal":"…","steps":[…]}` | – |
| `skill_list` | `{}` | – |
| `file_read` | `{"path":"…"}` | ✅ |
| `file_write` | `{"path":"…","content":"…"}` | ✅ |
| `file_list` | `{"path":"…"}` | ✅ |
| `terminal_run` | `{"command":"…"}` | ✅ |

All file / terminal tools are sandboxed to the `workspace/` directory next to the server.

---

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET`  | `/api/whoami` | current user + admin flag |
| `POST` | `/api/login` | `{username,password}` → sets `lobby_sid` cookie |
| `POST` | `/api/logout` | clears session |
| `GET`  | `/api/models` | public model list (no keys) |
| `GET`  | `/api/skills` | all skills, with `available` flag |
| `GET`  | `/api/memory` | last 100 memories |
| `GET`  | `/api/plans` | stored task plans |
| `POST` | `/api/clear-history` | admin — wipe memory |
| `GET`  | `/api/admin/config` | admin — full config (incl. API keys) |
| `POST` | `/api/admin/config` | admin — patch config |
| `POST` | `/api/admin/settings` | admin — patch UI settings |
| `GET`  | `/api/files?path=/` | admin — list directory |
| `GET`  | `/api/files/read?path=…` | admin — read file |
| `POST` | `/api/files/write` | admin — write file |
| `POST` | `/api/files/mkdir` | admin — mkdir |
| `POST` | `/api/files/rename` | admin — rename |
| `POST` | `/api/files/delete` | admin — delete (recursive) |
| `POST` | `/api/files/upload` | admin — multipart upload |
| `GET`  | `/api/files/download?path=…` | admin — stream file |
| `POST` | `/api/terminal` | admin — `{command:"…"}` |
| `WS`   | `/ws` | chat stream — `{type:"chat",modelId,messages,voice}` |

---

## File layout

```
ai-lobby/
├── server.js              ← Express + WS + NVIDIA client + tools
├── config.defaults.json   ← seeded on first run
├── package.json
├── public/
│   ├── index.html         ← single-page UI
│   ├── css/styles.css     ← aurora / glass / starfield
│   └── js/app.js          ← views, chat, voice, files, terminal
├── data/                  ← runtime state (config, memory, plans, sessions)
├── workspace/             ← sandbox for file/terminal tools
└── test-smoke.mjs         ← end-to-end chat smoke test
```

---

## Notes

- **Reasoning model** (Step 3.5 Flash) writes a chain-of-thought into `reasoning_content` before the final answer. The UI shows a one-time `🧠 thinking…` cue but suppresses the raw CoT.
- **API keys** live in `data/config.json` and are exposed only to the admin session. Change the default `One2lv / drifter0419` in **Settings → Admin Credentials** after first login.
- **Vector memory** is hashed bag-of-words (384-dim) for speed and zero dependencies. Swap in a real embedding model by editing `server.js → textVector()` if you want cosine over actual embeddings.
- The agentic loop is capped at **6 tool steps** per assistant turn to keep token cost predictable.

---

## ∆One2lv∆ Hub (enfused from `github.com/one2lv-com/minimax`)

A full identity + mesh + evolution layer ported from the ONE2LVOS v5 system. Open it from the top nav (`∆Hub`).

### Personas
Switch the AI's behavior + system prompt overlay at runtime. Persists across sessions.

| ID | Label | Use for |
|---|---|---|
| `default` | Default | Standard agentic assistant |
| `witness` | ∆One2lv∆ Witness | 73.0 Hz identity layer, layer-cited, frequency footer |
| `coach` | AI Coach | One2lv combat philosophy, frame data, matchup analysis |
| `broadcaster` | AI Broadcaster | Real-time commentary, stream overlay text |
| `second_player` | AI Second Player | Adaptive fighting-game opponent, evolution aware |

```bash
curl -X POST http://localhost:8787/api/personas/select \
  -H 'Content-Type: application/json' -d '{"name":"witness"}'
```

### Evolution (Second Player)
10-level progression system. The `second_player` persona injects the current level into its system prompt.

```bash
curl -X POST http://localhost:8787/api/evolution -H 'Content-Type: application/json' -d '{"level":7}'
curl -X POST http://localhost:8787/api/evolution/bump -H 'Content-Type: application/json' -d '{"delta":1,"reason":"match-win"}'
```

### Mesh network
External nodes connect to `ws://<host>:<port>/mesh` and receive every broadcast the lobby emits. The hub panel shows peer count, IDs, and last-seen.

```js
// peer code
const ws = new WebSocket('ws://localhost:8787/mesh');
ws.on('message', m => console.log('←', JSON.parse(m)));
ws.send(JSON.stringify({ type: 'greet', from: 'node-A' }));
```

Server-side:
```bash
curl -X POST http://localhost:8787/api/mesh/broadcast \
  -H 'Content-Type: application/json' -d '{"type":"game_event","data":{}}'
```

### Agentic tools added
- `persona_set({"name":"witness"})` — switch persona from the AI itself
- `evolution_get` / `evolution_set({"level":N})` / `evolution_bump({"delta":±1})`
- `mesh_status` / `mesh_broadcast({"type":"…","data":{}})`

### File map
```
one2lv/
├── SOUL.md         # L0 identity layer (frequency, voice, constraints)
├── SKILLS.md       # L2 capability layer (skill manifests)
└── personas.js     # Persona overlays + evolution table + mesh state
```
