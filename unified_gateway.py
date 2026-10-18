"""
One2lvOS Unified Gateway
========================
Single entry-point that merges all subsystems into one API surface.

Services wired in:
  Core OS       http://localhost:3002   (Flask + SovereignCouncil 7-agent)
  Sovereign Core http://localhost:3003  (FastAPI + ITT Council 9-seat + LumenisReactor)
  AI Arcade MCP  http://localhost:8003  (MCP 2024-11-05, 51 games)
  UI             http://localhost:9000
  Lumenis        http://localhost:9001

This gateway (port 8888):
  GET  /              → system manifest
  GET  /status        → live health of all subsystems
  POST /council       → route to SovereignCouncil (One2lvOS core)
  WS   /chat          → proxy to Sovereign Agentic Core WebSocket
  GET  /arcade/info   → arcade info
  GET  /arcade/games  → active games
  POST /arcade/create → create a game  {game_type, player1, player2}
  POST /arcade/move   → make a move    {game_id, player, move}
  GET  /arcade/board/{game_id}
  GET  /arcade/leaderboard
  GET  /arcade/library
  GET  /minmax/status → Phase 9 Delta Engine status
  POST /os/convene    → SovereignCouncil.convene(topic)
  POST /os/tournament → kick off agent tournament
"""

import asyncio
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Dynamically determine the installation directory
INSTALL_DIR = Path(__file__).parent.absolute()
sys.path.insert(0, str(INSTALL_DIR / "One2lvos"))

# ── Lazy imports (non-fatal if a subsystem is down) ──────────────────────────

def _try_import_council():
    try:
        from core.council.sovereign_council import SovereignCouncil
        return SovereignCouncil()
    except Exception as e:
        print(f"[gateway] SovereignCouncil unavailable: {e}")
        return None

sovereign_council = _try_import_council()


# ── HTTP helpers ─────────────────────────────────────────────────────────────

def _get(url: str, timeout: int = 5) -> Optional[dict]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            body = r.read()
            try:
                return json.loads(body)
            except Exception:
                # Non-JSON (HTML etc.) — still reachable
                return {"http_status": r.status, "reachable": True}
    except Exception:
        return None


def _post(url: str, body: dict, timeout: int = 10) -> Optional[dict]:
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}


def _arcade(tool: str, **kwargs) -> dict:
    return _post("http://localhost:8003/mcp", {
        "jsonrpc": "2.0", "id": 1,
        "method": "tools/call",
        "params": {"name": tool, "arguments": kwargs},
    }) or {"error": "arcade unreachable"}


def _arcade_result(resp: dict) -> dict:
    if not resp or "error" in resp:
        return resp or {"error": "no response"}
    try:
        import re
        text = resp["result"]["content"][0]["text"]
        try:
            return json.loads(text)
        except Exception:
            result = {"raw": text}
            m = re.search(r"ID\s*:\s*([A-F0-9]{6,})", text)
            if m:
                result["game_id"] = m.group(1)
            return result
    except (KeyError, IndexError):
        return resp.get("result", resp)


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(title="One2lvOS Unified Gateway", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

SERVICES = {
    "os_core":    "http://localhost:3002/health",
    "sac":        "http://localhost:3003/api/status",
    "arcade":     "http://localhost:8003",
    "ai_lobby":   "http://localhost:8006",
    "lumenis_v7": "http://localhost:8005",
    "steamos":    "http://localhost:8080",
    "ui":         "http://localhost:9000",
    "lumenis":    "http://localhost:9001",
    "lumenis_os": "http://localhost:9002/api/healthz",
    "aetherix":   "http://localhost:9003/health",
    # File Transfer & Remote Access
    "ftp":        "http://localhost:2121",
    "webdav":     "http://localhost:8090",
    "ssh":        "http://localhost:2222",
    "network_api":"http://localhost:3004",
}


# ── System manifest ───────────────────────────────────────────────────────────

@app.get("/")
async def manifest():
    return {
        "name": "One2lvOS Unified Gateway",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "subsystems": {
            "os_core": {
                "url": "http://localhost:3002",
                "description": "One2lvOS Core — SovereignCouncil 7-agent decision system",
                "council_agents": ["Strategist", "Executor", "Analyst", "Guardian", "Innovator", "Connector", "Oracle"],
            },
            "sovereign_agentic_core": {
                "url": "http://localhost:3003",
                "description": "Sovereign Agentic Core — ITT Council of Nine seats + LumenisReactor + FluxCompass",
                "seats": ["Witness", "Sentinel", "Navigator", "Weaver", "Forge", "Oracle", "Architect", "Hermes", "Gambit"],
                "ws": "ws://localhost:3003/ws",
            },
            "ai_arcade": {
                "url": "http://localhost:8003",
                "mcp": "http://localhost:8003/mcp",
                "description": "AI Arcade MCP — 51-title game library, MCP 2024-11-05",
                "playable": ["chess", "go", "checkers", "othello", "tictactoe", "connect4",
                             "minesweeper", "sudoku", "scrabble", "battleship", "pacman",
                             "tetris", "space_invaders", "pong", "universal_paperclips"],
            },
            "minmax_phase9": {
                "root": str(INSTALL_DIR / "minmax" / "opt" / "one2lv"),
                "description": "Phase 9 Delta Engine ∆⁹ + 3D Vector Engine ³",
                "features": ["DeltaEngine 9-layer gradient", "SystemDynamics spherical vectors",
                             "Phase9 Council", "VectorDB", "SecureRPC", "SandboxExecutor"],
            },
            "ui":       {"url": "http://localhost:9000", "description": "One2lvOS Web UI"},
            "lumenis":  {"url": "http://localhost:9001", "description": "Lumenis Space Agent v1 (Three.js)"},
            "lumenis_os": {
                "url": "http://localhost:9002",
                "description": "LumenisOS — TypeScript monorepo: Express 5 API + React windowing OS (Terminal, Brawlhalla, Twitch, Telemetry, Reactor)",
                "api": "http://localhost:9002/api/healthz",
            },
            "aetherix": {
                "url": "http://localhost:9003",
                "description": "Aetherix One2lv Master Terminal — 5 Sanctuary Roles (Architect, Sentry, Witness, Aetheron, Fifth Position), autonomous 5s cycle, Kernel state machine",
                "sanctuary_roles": ["Architect", "Sentry", "Witness", "Aetheron", "Fifth Position"],
            },
        },
        "ai_lobby": {
            "url":         "http://localhost:8006",
            "ws":          "ws://localhost:8006/room",
            "description": "Central hub — all 29+ agents registered, broadcast + discovery",
            "agents_url":  "http://localhost:8006/agents",
        },
        "lumenis_v7": {
            "url":         "http://localhost:8005",
            "description": "Lumenis v7 Cosmic — 73Hz council, telemetry, Gemini AI, Twitch",
        },
        "steamos_dashboard": {
            "url":         "http://localhost:8080",
            "description": "SteamOS Lumenis — AI Coach, Broadcaster, Dashboard v4",
        },
        "ftp": {
            "url":         "ftp://localhost:2121",
            "description": "One2lvOS FTP Server — pyftpdlib, user: one2lv, anonymous read-only",
            "root":        "ftp_root/",
        },
        "webdav": {
            "url":         "http://localhost:8090",
            "description": "One2lvOS WebDAV Server — wsgidav, user: one2lv, full CRUD",
            "root":        "webdav_root/",
        },
        "ssh": {
            "url":         "ssh://localhost:2222",
            "description": "One2lvOS SSH Server — paramiko, user: one2lv, interactive shell + exec",
            "connect":     "ssh one2lv@localhost -p 2222",
        },
        "network_api": {
            "url":         "http://localhost:3004",
            "description": "One2lvOS Network API — mesh routing, WebDAV/FTP client connections",
        },
        "endpoints": {
            "status":           "GET  /status",
            "council":          "POST /council          {topic}",
            "tournament":       "POST /os/tournament",
            "chat_ws":          "WS   /chat",
            "lobby_agents":     "GET  /lobby/agents",
            "lobby_broadcast":  "POST /lobby/broadcast  {from,content}",
            "lobby_systems":    "GET  /lobby/systems",
            "lobby_ws":         "WS   /lobby/room",
            "arcade_info":      "GET  /arcade/info",
            "arcade_games":     "GET  /arcade/games",
            "arcade_create":    "POST /arcade/create    {game_type,player1,player2}",
            "arcade_move":      "POST /arcade/move      {game_id,player,move}",
            "arcade_board":     "GET  /arcade/board/{game_id}",
            "leaderboard":      "GET  /arcade/leaderboard",
            "library":          "GET  /arcade/library",
            "lumenis_os_health":"GET  /lumenis-os/health",
            "lumenis_os_checkpoint": "POST /lumenis-os/checkpoint {tag,baseline,resonance}",
            "aetherix":         "GET  /aetherix",
            "aetherix_memory":  "GET/POST /aetherix/memory",
            "aetherix_sanctuary": "POST /aetherix/sanctuary {role,cycle}",
        },
    }


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/status")
async def status():
    results: Dict[str, Any] = {}
    loop = asyncio.get_event_loop()

    async def check(name, url):
        try:
            resp = await loop.run_in_executor(None, lambda: _get(url, 3))
            results[name] = {"online": resp is not None, "data": resp}
        except Exception as e:
            results[name] = {"online": False, "error": str(e)}

    async def check_tcp(name, host, port):
        import socket as _sock
        try:
            s = _sock.create_connection((host, port), timeout=2)
            s.close()
            results[name] = {"online": True, "data": {"tcp": f"{host}:{port}"}}
        except Exception:
            results[name] = {"online": False, "data": None}

    await asyncio.gather(
        check("os_core", "http://localhost:3002/status"),
        check("sac", "http://localhost:3003/api/status"),
        check("arcade", "http://localhost:8003"),
        check("ai_lobby", "http://localhost:8006"),
        check("lumenis_v7", "http://localhost:8005"),
        check("ui", "http://localhost:9000"),
        check("lumenis", "http://localhost:9001"),
        check("lumenis_os", "http://localhost:9002/api/healthz"),
        check("aetherix", "http://localhost:9003/health"),
        check("network_api", "http://localhost:3004"),
        check_tcp("ftp", "localhost", 2121),
        check_tcp("webdav", "localhost", 8090),
        check_tcp("ssh", "localhost", 2222),
    )

    online = sum(1 for v in results.values() if v.get("online"))
    return {"online": online, "total": len(results), "services": results,
            "timestamp": datetime.utcnow().isoformat() + "Z"}


# ── Sovereign Council (One2lvOS Core) ─────────────────────────────────────────

@app.post("/council")
async def convene(body: dict):
    topic = body.get("topic", "")
    if not topic:
        return JSONResponse({"error": "topic required"}, 400)
    if sovereign_council:
        loop = asyncio.get_event_loop()
        decision = await loop.run_in_executor(None, sovereign_council.convene, topic)
        return decision
    # Fallback: call core service API
    result = await asyncio.get_event_loop().run_in_executor(
        None, lambda: _post("http://localhost:3002/status", {})
    )
    return result or {"error": "council unavailable"}


@app.post("/os/tournament")
async def tournament():
    if sovereign_council:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, sovereign_council.arcade_tournament)
        return result
    return {"error": "SovereignCouncil not loaded"}


@app.get("/os/arcade")
async def os_arcade_status():
    if sovereign_council:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, sovereign_council.arcade_status)
    return {"error": "SovereignCouncil not loaded"}


# ── AI Arcade ─────────────────────────────────────────────────────────────────

@app.get("/arcade/info")
async def arcade_info():
    loop = asyncio.get_event_loop()
    raw = await loop.run_in_executor(None, lambda: _arcade("arcade_info"))
    return _arcade_result(raw)


@app.get("/arcade/games")
async def arcade_games():
    loop = asyncio.get_event_loop()
    raw = await loop.run_in_executor(None, lambda: _arcade("list_games"))
    return _arcade_result(raw)


@app.post("/arcade/create")
async def arcade_create(body: dict):
    game_type = body.get("game_type", "chess")
    player1   = body.get("player1", "player1")
    player2   = body.get("player2", "player2")
    loop = asyncio.get_event_loop()

    created = await loop.run_in_executor(
        None, lambda: _arcade_result(_arcade("create_game", game_type=game_type, player_name=player1))
    )
    game_id = created.get("game_id")
    if not game_id:
        return created
    if created.get("game_status") == "active":
        return created
    joined = await loop.run_in_executor(
        None, lambda: _arcade_result(_arcade("join_game", game_id=game_id, player_name=player2))
    )
    return {"game_id": game_id, **joined}


@app.post("/arcade/move")
async def arcade_move(body: dict):
    game_id = body.get("game_id", "")
    player  = body.get("player", "player1")
    move    = body.get("move", "")
    if not game_id or not move:
        return JSONResponse({"error": "game_id and move required"}, 400)
    loop = asyncio.get_event_loop()
    raw = await loop.run_in_executor(
        None, lambda: _arcade("make_move", game_id=game_id, player_name=player, move=move)
    )
    return _arcade_result(raw)


@app.get("/arcade/board/{game_id}")
async def arcade_board(game_id: str):
    loop = asyncio.get_event_loop()
    raw = await loop.run_in_executor(
        None, lambda: _arcade("get_game_state", game_id=game_id)
    )
    return _arcade_result(raw)


@app.get("/arcade/leaderboard")
async def arcade_leaderboard():
    loop = asyncio.get_event_loop()
    raw = await loop.run_in_executor(None, lambda: _arcade("get_leaderboard"))
    return _arcade_result(raw)


@app.get("/arcade/library")
async def arcade_library(category: Optional[str] = None):
    loop = asyncio.get_event_loop()
    kwargs = {"category": category} if category else {}
    raw = await loop.run_in_executor(None, lambda: _arcade("library_list", **kwargs))
    return _arcade_result(raw)


# ── AI Lobby proxy ───────────────────────────────────────────────────────────

@app.get("/lobby/agents")
async def lobby_agents(system: Optional[str] = None):
    url = "http://localhost:8006/agents" + (f"?system={system}" if system else "")
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _get(url)) or {"error": "lobby unavailable"}


@app.post("/lobby/broadcast")
async def lobby_broadcast(body: dict):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _post("http://localhost:8006/broadcast", body)) or {"error": "lobby unavailable"}


@app.get("/lobby/systems")
async def lobby_systems():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _get("http://localhost:8006/systems")) or {"error": "lobby unavailable"}


@app.websocket("/lobby/room")
async def lobby_room_proxy(ws: WebSocket):
    """Proxy client websocket to AI Lobby room."""
    import websockets
    await ws.accept()
    try:
        async with websockets.connect("ws://localhost:8006/room") as upstream:
            async def fwd_up():
                while True:
                    await upstream.send(await ws.receive_text())
            async def fwd_dn():
                async for msg in upstream:
                    await ws.send_text(msg)
            done, pending = await asyncio.wait(
                [asyncio.create_task(fwd_up()), asyncio.create_task(fwd_dn())],
                return_when=asyncio.FIRST_COMPLETED,
            )
            for t in pending: t.cancel()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try: await ws.send_json({"type": "error", "message": str(e)})
        except Exception: pass


# ── WebSocket proxy → Sovereign Agentic Core ─────────────────────────────────

@app.websocket("/chat")
async def chat_ws(ws: WebSocket):
    """
    Bidirectional proxy between a client and the Sovereign Agentic Core WebSocket.
    All messages flow through: client ↔ gateway ↔ SAC (ITT Council of Nine).
    """
    import websockets

    await ws.accept()
    try:
        async with websockets.connect("ws://localhost:3003/ws") as upstream:

            async def forward_up():
                while True:
                    msg = await ws.receive_text()
                    await upstream.send(msg)

            async def forward_down():
                async for msg in upstream:
                    await ws.send_text(msg)

            done, pending = await asyncio.wait(
                [asyncio.create_task(forward_up()), asyncio.create_task(forward_down())],
                return_when=asyncio.FIRST_COMPLETED,
            )
            for t in pending:
                t.cancel()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


# ── LumenisOS proxy ──────────────────────────────────────────────────────────

@app.get("/lumenis-os/health")
async def lumenis_os_health():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _get("http://localhost:9002/api/healthz")) or {"error": "lumenis-os unavailable"}


@app.post("/lumenis-os/checkpoint")
async def lumenis_os_checkpoint(body: dict):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _post("http://localhost:9002/api/checkpoint", body)) or {"error": "lumenis-os unavailable"}


# ── Aetherix proxy ────────────────────────────────────────────────────────────

@app.get("/aetherix")
async def aetherix_root():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _get("http://localhost:9003/health")) or {"error": "aetherix unavailable"}


@app.get("/aetherix/memory")
async def aetherix_memory_get():
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _get("http://localhost:9003/memory")) or {}


@app.post("/aetherix/memory")
async def aetherix_memory_post(body: dict):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _post("http://localhost:9003/memory", body)) or {"error": "aetherix unavailable"}


@app.post("/aetherix/sanctuary")
async def aetherix_sanctuary(body: dict):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: _post("http://localhost:9003/sanctuary", body)) or {"error": "aetherix unavailable"}


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n╔══════════════════════════════════════════════════════╗")
    print("║   One2lvOS Unified Gateway  — port 8888              ║")
    print("╠══════════════════════════════════════════════════════╣")
    print("║  Manifest  : http://localhost:8888                   ║")
    print("║  Status    : http://localhost:8888/status            ║")
    print("║  Council   : POST http://localhost:8888/council      ║")
    print("║  Arcade    : http://localhost:8888/arcade/info       ║")
    print("║  LumenisOS : http://localhost:8888/lumenis-os/health ║")
    print("║  Aetherix  : http://localhost:8888/aetherix          ║")
    print("║  Chat WS   : ws://localhost:8888/chat                ║")
    print("╚══════════════════════════════════════════════════════╝\n")
    uvicorn.run(app, host="0.0.0.0", port=8888)
