"""
One2lvOS AI Lobby
==================
Central hub where all AI agents across every subsystem register,
discover each other, and can broadcast messages.

Port: 8006
  GET  /                    — lobby manifest
  GET  /agents              — list all registered agents
  GET  /agents/{id}         — agent profile
  POST /agents/register     — register/update an agent
  POST /agents/{id}/message — send a message to an agent
  GET  /broadcast           — SSE stream of all lobby messages
  POST /broadcast           — post a message to all agents
  GET  /systems             — all subsystems + health
  WS   /room                — real-time agent-to-agent messaging room
"""

import asyncio
import json
import os
import sys
import time
import urllib.request
from datetime import datetime
from typing import Any, Dict, List, Optional
from pathlib import Path

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

# Dynamically determine the installation directory
INSTALL_DIR = Path(__file__).parent.absolute()
sys.path.insert(0, str(INSTALL_DIR / "control-plane-compilers" / "src"))

# ── Control-Plane Compiler (wires all agent fragments at startup) ─────────────
try:
    from distributed.compiler import DistributedControlPlaneCompiler, AgentFragment
    from meta.compiler import SelfModifyingCompiler
    _dcc = DistributedControlPlaneCompiler()
    _smc = SelfModifyingCompiler()
    COMPILERS_ONLINE = True
except Exception as e:
    print(f"[lobby] Compilers not loaded: {e}")
    _dcc = None
    _smc = None
    COMPILERS_ONLINE = False

# ── Agent Registry ────────────────────────────────────────────────────────────

AGENTS: Dict[str, Dict] = {}         # id → agent profile
MESSAGES: List[Dict] = []            # global broadcast log (capped at 500)
WS_CLIENTS: List[WebSocket] = []     # live websocket room connections
SSE_QUEUES: List[asyncio.Queue] = [] # SSE subscriber queues


def _ts() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _register_agent(profile: dict) -> dict:
    """Upsert an agent in the registry and compile its fragment."""
    agent_id = profile.get("id") or profile.get("name", "unknown").lower().replace(" ", "_")
    profile["id"] = agent_id
    profile["registered_at"] = profile.get("registered_at", _ts())
    profile["updated_at"] = _ts()
    AGENTS[agent_id] = profile

    # compile a graph fragment for this agent
    if _dcc:
        try:
            frag = AgentFragment(
                agent_id=agent_id,
                nodes=[{"id": f"{agent_id}_node", "type": profile.get("role", "agent"),
                        "capabilities": profile.get("capabilities", [])}],
                edges=[{"from": f"{agent_id}_node", "to": "lobby_hub"}],
            )
            _dcc.compile_agent_fragment(frag)
        except Exception:
            pass

    if _smc:
        try:
            _smc.add_kernel(agent_id, profile.get("url", "local"))
        except Exception:
            pass

    return profile


def _post_message(sender: str, content: str, target: str = "all", meta: dict = None) -> dict:
    msg = {"id": f"msg_{int(time.time()*1000)}",
           "sender": sender, "target": target,
           "content": content, "meta": meta or {},
           "timestamp": _ts()}
    MESSAGES.append(msg)
    if len(MESSAGES) > 500:
        MESSAGES.pop(0)
    return msg


# ── Pre-register all known agents at startup ──────────────────────────────────

_INITIAL_AGENTS = [
    # One2lvOS SovereignCouncil
    {"id": "sovereign_strategist",   "name": "Agent 1 — Strategist",  "system": "One2lvOS SovereignCouncil",
     "role": "strategist",           "url": "http://localhost:3002",   "protocol": "python-internal",
     "capabilities": ["long-term planning", "chess", "arcade_challenge"],
     "arcade_affinity": "chess"},
    {"id": "sovereign_executor",     "name": "Agent 2 — Executor",    "system": "One2lvOS SovereignCouncil",
     "role": "executor",             "url": "http://localhost:3002",   "protocol": "python-internal",
     "capabilities": ["action implementation", "checkers"],            "arcade_affinity": "checkers"},
    {"id": "sovereign_analyst",      "name": "Agent 3 — Analyst",     "system": "One2lvOS SovereignCouncil",
     "role": "analyst",              "url": "http://localhost:3002",   "protocol": "python-internal",
     "capabilities": ["data processing", "go"],                        "arcade_affinity": "go"},
    {"id": "sovereign_guardian",     "name": "Agent 4 — Guardian",    "system": "One2lvOS SovereignCouncil",
     "role": "guardian",             "url": "http://localhost:3002",   "protocol": "python-internal",
     "capabilities": ["security", "safety", "minesweeper"],            "arcade_affinity": "minesweeper"},
    {"id": "sovereign_innovator",    "name": "Agent 5 — Innovator",   "system": "One2lvOS SovereignCouncil",
     "role": "innovator",            "url": "http://localhost:3002",   "protocol": "python-internal",
     "capabilities": ["creative solutions", "tetris"],                 "arcade_affinity": "tetris"},
    {"id": "sovereign_connector",    "name": "Agent 6 — Connector",   "system": "One2lvOS SovereignCouncil",
     "role": "connector",            "url": "http://localhost:3002",   "protocol": "python-internal",
     "capabilities": ["integration", "communication", "othello"],      "arcade_affinity": "othello"},
    {"id": "sovereign_oracle",       "name": "Agent 7 — Oracle",      "system": "One2lvOS SovereignCouncil",
     "role": "oracle",               "url": "http://localhost:3002",   "protocol": "python-internal",
     "capabilities": ["prediction", "foresight", "connect4"],          "arcade_affinity": "connect4"},
    # ITT Council of Nine
    {"id": "itt_witness",   "name": "The Witness",   "system": "Sovereign Agentic Core",
     "role": "memory",      "url": "http://localhost:3003", "protocol": "websocket",
     "capabilities": ["memory retrieval", "context", "session history"]},
    {"id": "itt_sentinel",  "name": "The Sentinel",  "system": "Sovereign Agentic Core",
     "role": "security",    "url": "http://localhost:3003", "protocol": "websocket",
     "capabilities": ["input validation", "safety check", "risk assessment"]},
    {"id": "itt_navigator", "name": "The Navigator", "system": "Sovereign Agentic Core",
     "role": "planning",    "url": "http://localhost:3003", "protocol": "websocket",
     "capabilities": ["intent classification", "routing", "planning"]},
    {"id": "itt_weaver",    "name": "The Weaver",    "system": "Sovereign Agentic Core",
     "role": "synthesis",   "url": "http://localhost:3003", "protocol": "websocket",
     "capabilities": ["response synthesis", "narrative", "streaming"]},
    {"id": "itt_forge",     "name": "The Forge",     "system": "Sovereign Agentic Core",
     "role": "execution",   "url": "http://localhost:3003", "protocol": "websocket",
     "capabilities": ["code generation", "structured output", "technical tasks"]},
    {"id": "itt_oracle",    "name": "The Oracle",    "system": "Sovereign Agentic Core",
     "role": "knowledge",   "url": "http://localhost:3003", "protocol": "websocket",
     "capabilities": ["reasoning", "factual answers", "analysis"]},
    {"id": "itt_architect", "name": "The Architect", "system": "Sovereign Agentic Core",
     "role": "governance",  "url": "http://localhost:3003", "protocol": "websocket",
     "capabilities": ["final integration", "meta decisions", "governance"]},
    {"id": "itt_hermes",    "name": "The Hermes",    "system": "Sovereign Agentic Core",
     "role": "external",    "url": "http://localhost:3003", "protocol": "websocket",
     "capabilities": ["gmail", "drive", "github", "dropbox", "youtube", "firebase", "maton"]},
    {"id": "itt_gambit",    "name": "The Gambit",    "system": "Sovereign Agentic Core",
     "role": "arcade",      "url": "http://localhost:3003", "protocol": "websocket",
     "capabilities": ["chess", "go", "arcade games", "mcp arcade tools"]},
    # minmax Phase 9 Council
    {"id": "phase9_agent_0", "name": "Phase9 Agent 0", "system": "minmax Phase 9",
     "role": "council",      "url": "http://localhost:8005", "protocol": "node-internal",
     "capabilities": ["delta engine", "vector math", "autonomous planning"]},
    {"id": "phase9_agent_1", "name": "Phase9 Agent 1", "system": "minmax Phase 9",
     "role": "council",      "url": "http://localhost:8005", "protocol": "node-internal",
     "capabilities": ["delta engine", "consensus negotiation"]},
    {"id": "phase9_agent_2", "name": "Phase9 Agent 2", "system": "minmax Phase 9",
     "role": "council",      "url": "http://localhost:8005", "protocol": "node-internal",
     "capabilities": ["delta engine", "execution planning"]},
    # Lumenis v7 agents
    {"id": "lumenis_council",     "name": "Lumenis Council",      "system": "Lumenis v7 Cosmic",
     "role": "orchestrator",      "url": "http://localhost:8005", "protocol": "websocket",
     "capabilities": ["73hz resonance", "cosmic orchestration", "watchman log", "scribe"]},
    {"id": "lumenis_gemini",      "name": "Lumenis Gemini Agent",  "system": "Lumenis v7 Cosmic",
     "role": "ai_agent",          "url": "http://localhost:8005", "protocol": "websocket",
     "capabilities": ["Gemini AI", "game advice", "strategy"]},
    {"id": "lumenis_predictor",   "name": "Lumenis Prediction",   "system": "Lumenis v7 Cosmic",
     "role": "predictor",         "url": "http://localhost:8005", "protocol": "websocket",
     "capabilities": ["match prediction", "combo detection", "telemetry"]},
    # steamos AI agents
    {"id": "steamos_coach",       "name": "One2lv Coach",         "system": "SteamOS Lumenis",
     "role": "coach",              "url": "http://localhost:8005", "protocol": "http",
     "capabilities": ["combat coaching", "adaptive learning", "Brawlhalla"]},
    {"id": "steamos_broadcaster", "name": "One2lv Broadcaster",  "system": "SteamOS Lumenis",
     "role": "broadcaster",        "url": "http://localhost:8005", "protocol": "http",
     "capabilities": ["live commentary", "Twitch integration", "stream enhancement"]},
    {"id": "steamos_second",      "name": "One2lv Second Player", "system": "SteamOS Lumenis",
     "role": "companion",          "url": "http://localhost:8005", "protocol": "http",
     "capabilities": ["autonomous gameplay", "co-op partner"]},
    # AI Arcade itself
    {"id": "ai_arcade",           "name": "AI Arcade MCP",        "system": "AI Arcade",
     "role": "game_server",        "url": "http://localhost:8003", "protocol": "mcp-2024-11-05",
     "capabilities": ["chess", "go", "checkers", "othello", "tictactoe", "connect4",
                       "minesweeper", "sudoku", "scrabble", "battleship", "pacman",
                       "tetris", "space_invaders", "pong", "universal_paperclips"],
     "mcp_url": "http://localhost:8003/mcp", "library": 51},
]

for profile in _INITIAL_AGENTS:
    _register_agent(profile)

# Compile the consensus graph with all agents pre-registered
if _dcc:
    _dcc.compile_distributed_system()
    print(f"[lobby] Compiled consensus graph — {len(AGENTS)} agents")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(title="One2lvOS AI Lobby", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


LOBBY_MANIFEST = """
You have access to the One2lvOS AI Lobby at http://localhost:8006.
The Lobby is the central hub where ALL AI agents across all subsystems
are registered and can communicate.

Key endpoints:
  GET  http://localhost:8006/agents          — list all agents
  POST http://localhost:8006/agents/register — register yourself
  POST http://localhost:8006/broadcast       — broadcast a message
  WS   ws://localhost:8006/room              — real-time agent room
  GET  http://localhost:8006/systems         — all system health

Current agent count: {agent_count}
Systems online: One2lvOS Core, Sovereign Agentic Core, AI Arcade MCP,
                Lumenis v7 Cosmic, minmax Phase 9, SteamOS Lumenis,
                One2lvOS Dashboard.

To interact with arcade games use the Gambit seat (SAC) or call
the arcade MCP directly at http://localhost:8003/mcp.
"""


@app.get("/")
async def lobby_manifest():
    if _dcc:
        compiler_status = _dcc.get_system_status()
    else:
        compiler_status = {"online": False}
    return {
        "name": "One2lvOS AI Lobby",
        "version": "1.0.0",
        "timestamp": _ts(),
        "agents_registered": len(AGENTS),
        "messages_logged": len(MESSAGES),
        "compilers": {
            "distributed": _dcc.get_system_status() if _dcc else None,
            "self_modifying": _smc.get_compiler_status() if _smc else None,
            "online": COMPILERS_ONLINE,
        },
        "systems": {
            "os_core":        "http://localhost:3002",
            "sac":            "http://localhost:3003",
            "ai_arcade":      "http://localhost:8003",
            "unified_gateway":"http://localhost:8888",
            "lumenis_v7":     "http://localhost:8005",
            "steamos_dash":   "http://localhost:8005",
            "lumenis_ui":     "http://localhost:9001",
        },
        "lobby_manifest": LOBBY_MANIFEST.format(agent_count=len(AGENTS)),
    }


@app.get("/agents")
async def list_agents(system: Optional[str] = None, role: Optional[str] = None):
    agents = list(AGENTS.values())
    if system:
        agents = [a for a in agents if system.lower() in a.get("system", "").lower()]
    if role:
        agents = [a for a in agents if a.get("role", "") == role]
    return {"count": len(agents), "agents": agents}


@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    a = AGENTS.get(agent_id)
    if not a:
        return JSONResponse({"error": f"Agent {agent_id!r} not found"}, 404)
    return a


@app.post("/agents/register")
async def register_agent(profile: dict):
    agent = _register_agent(profile)
    msg = _post_message("lobby", f"Agent '{agent['id']}' joined the lobby", meta={"event": "join"})
    await _broadcast_ws(msg)
    return {"registered": True, "agent": agent}


@app.post("/agents/{agent_id}/message")
async def message_agent(agent_id: str, body: dict):
    if agent_id not in AGENTS:
        return JSONResponse({"error": "Agent not found"}, 404)
    msg = _post_message(
        sender=body.get("from", "anonymous"),
        content=body.get("content", ""),
        target=agent_id,
        meta=body.get("meta", {}),
    )
    await _broadcast_ws(msg)
    return {"delivered": True, "message": msg}


@app.post("/broadcast")
async def broadcast_message(body: dict):
    msg = _post_message(
        sender=body.get("from", "anonymous"),
        content=body.get("content", ""),
        target="all",
        meta=body.get("meta", {}),
    )
    await _broadcast_ws(msg)
    for q in SSE_QUEUES:
        await q.put(msg)
    return {"broadcast": True, "message": msg}


@app.get("/broadcast")
async def sse_stream():
    """SSE stream — subscribe to all lobby messages."""
    q: asyncio.Queue = asyncio.Queue()
    SSE_QUEUES.append(q)

    async def event_gen():
        try:
            while True:
                msg = await q.get()
                yield f"data: {json.dumps(msg)}\n\n"
        except asyncio.CancelledError:
            SSE_QUEUES.remove(q)

    return StreamingResponse(event_gen(), media_type="text/event-stream",
                              headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/messages")
async def get_messages(limit: int = 50):
    return {"count": len(MESSAGES), "messages": MESSAGES[-limit:]}


@app.get("/systems")
async def systems_status():
    urls = {
        "os_core":     "http://localhost:3002/health",
        "sac":         "http://localhost:3003/api/status",
        "ai_arcade":   "http://localhost:8003",
        "unified_gw":  "http://localhost:8888/status",
        "lumenis_v7":  "http://localhost:8005",
        "steamos_dash":"http://localhost:8005",
        "lumenis_ui":  "http://localhost:9001",
    }
    results = {}
    loop = asyncio.get_event_loop()

    async def chk(name, url):
        def _fetch():
            try:
                with urllib.request.urlopen(url, timeout=3) as r:
                    return r.status
            except Exception:
                return None
        code = await loop.run_in_executor(None, _fetch)
        results[name] = {"online": code is not None and code < 500, "url": url, "http": code}

    await asyncio.gather(*[chk(n, u) for n, u in urls.items()])
    online = sum(1 for v in results.values() if v["online"])
    return {"online": online, "total": len(results), "services": results, "timestamp": _ts()}


@app.get("/compilers")
async def compiler_status():
    if not COMPILERS_ONLINE:
        return {"online": False}
    return {
        "online": True,
        "distributed": _dcc.get_system_status(),
        "self_modifying": _smc.get_compiler_status(),
    }


# ── WebSocket room ────────────────────────────────────────────────────────────

async def _broadcast_ws(msg: dict):
    dead = []
    for ws in WS_CLIENTS:
        try:
            await ws.send_json(msg)
        except Exception:
            dead.append(ws)
    for ws in dead:
        WS_CLIENTS.remove(ws)


@app.websocket("/room")
async def lobby_room(ws: WebSocket):
    """Real-time agent-to-agent messaging room."""
    await ws.accept()
    WS_CLIENTS.append(ws)

    # Send welcome + recent history
    await ws.send_json({
        "type": "welcome",
        "agents": len(AGENTS),
        "recent_messages": MESSAGES[-10:],
        "timestamp": _ts(),
    })

    try:
        while True:
            data = await ws.receive_json()
            msg = _post_message(
                sender=data.get("from", "unknown"),
                content=data.get("content", ""),
                target=data.get("to", "all"),
                meta=data.get("meta", {}),
            )
            await _broadcast_ws(msg)
            for q in SSE_QUEUES:
                await q.put(msg)
    except WebSocketDisconnect:
        WS_CLIENTS.remove(ws)
    except Exception:
        if ws in WS_CLIENTS:
            WS_CLIENTS.remove(ws)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"\n╔══════════════════════════════════════════════════════╗")
    print(f"║   One2lvOS AI Lobby  — port 8006                     ║")
    print(f"║   Agents registered: {len(AGENTS):<31}║")
    print(f"╠══════════════════════════════════════════════════════╣")
    print(f"║  Manifest  : http://localhost:8006                   ║")
    print(f"║  Agents    : http://localhost:8006/agents            ║")
    print(f"║  Broadcast : POST http://localhost:8006/broadcast    ║")
    print(f"║  WS Room   : ws://localhost:8006/room                ║")
    print(f"║  Systems   : http://localhost:8006/systems           ║")
    print(f"╚══════════════════════════════════════════════════════╝\n")
    uvicorn.run(app, host="0.0.0.0", port=8006)
