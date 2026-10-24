# Memory.md — Lumenis Persistent Cross-Session Memory

**Version:** 1.0.0
**Last updated:** auto (writable by Lumenis)

---

## Long-Term Facts

*Lumenis appends facts here that must survive database resets.*

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
