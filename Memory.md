# Memory.md — Lumenis Persistent Cross-Session Memory

**Version:** 1.0.0
**Last updated:** auto (writable by Lumenis)

---

## Long-Term Facts

*Lumenis appends facts here that must survive database resets.*

### AstraDB (L1 Vector Memory)
- Endpoint: `https://9b5b1939-fd21-477d-95b8-a1aecc5f90b9-us-east-2.apps.astra.datastax.com`
- Token env: `ASTRA_DB_APPLICATION_TOKEN` / `ASTRA_DB_TOKEN`
- Keyspace: `default_keyspace` (free tier — single keyspace only; `one2lvOS` cannot be created)
- Collections: `files` (737 docs), `commits` (86 docs), `aria_memory`, `aria_memory_v2`, `aria_memory_v3`, `conversations`, `messages`, `vector_memories`
- `files` collection: `indexing deny=[content, sha256]` — required, Astra caps indexed strings at 8000 bytes
- Re-ingest: `ASTRA_DB_KEYSPACE=default_keyspace python3 ingest_one2lvos.py` (drops+recreates `files` on each run)

### NVIDIA NIM (L2 Skills)
- Base URL: `https://integrate.api.nvidia.com/v1`
- Primary key env: `NVIDIA_API_KEY`
- Embedding model: `nvidia/nv-embedqa-e5-v5` (dim=1024)
- LLM model: `nvidia/llama-3.3-nemotron-super-49b-v1`
- Secondary keys: `NVIDIA_API_KEY_SECONDARY`, `NVIDIA_API_KEY_NEMOTRON_SUPER`, `NVIDIA_API_KEY_MINIMAX`, `NVIDIA_API_KEY_STEPFUN`, `NVIDIA_API_KEY_KIMI`

### External Gateways
- Discord bot token env: `DISCORD_BOT_TOKEN`, channel: `719260428836012032`
- Twitch: username `one2lv`, channel `one2lv`, token env: `TWITCH_OAUTH_TOKEN`
- Supabase: `https://pplbxjguhmfeuptyamic.supabase.co` — keys in `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- GitHub token env: `GITHUB_TOKEN`
- Maton API key env: `MATON_API_KEY`

### .env Location
- `/home/vercel-sandbox/One2lvos/.env` — master sovereign architecture .env
- Load with: `set -a && source .env && set +a`

---

- One2lvOS desktop runs at `one2lvos-desktop.html`, served by lumenis-main.py static mount
- Lumenis Reactor Core: port 8000, FastAPI + WebSocket
- AI Lobby: port 8006, 27+ agents registered
- SteamOS Lumenis v7: port 8005 (Node.js, lumenis_v7/server.js)
- Minimax Core API: port 8080
- Network Manager API: port 3003
- Sovereign Agentic Core: port 3003 (conflict — check before use)
- PNG boot keyword: `one2lvos-snapshot`
- compass.db tables: sessions, messages, facts, vectors, checkpoints, objectives, services_watch
- VectorFS API: POST /vectorfs/index, POST /vectorfs/search, GET /vectorfs/stats
- Checkpoint API: POST /api/checkpoints, GET /api/checkpoints, GET /api/checkpoints/{id}
- Objectives API: POST /api/objectives, GET /api/objectives, PATCH /api/objectives/{id}
- Infra API: POST /api/infra/change (self-authorized, GRANT)

---

## Learned Skills

*Lumenis appends new skills here as they are acquired.*

- PNG tEXt chunk injection / extraction (CRC32, offset 33)
- Cosine similarity vector search (float32 BLOB in SQLite)
- WebSocket broadcasting to all connected clients
- asyncio background task management
- compass.db schema self-repair

---

## Active Objectives

*Mirror of compass.db objectives table — human-readable view.*

<!-- Lumenis appends active objectives here -->

---

## Notes to Self

*Lumenis appends observations, anomalies, and decisions here.*

<!-- entries appended by Lumenis autonomously -->
