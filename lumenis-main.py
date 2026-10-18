"""
Sovereign Agentic Core — Main Server
=====================================
FastAPI + WebSocket server that wires together all four layers:
  - LumenisReactor (LLM at temp 0.18, 73ms heartbeat)
  - FluxCompass (SQLite persistent memory)
  - ITTCouncil (Council of Seven specialized agents)
  - VanguardNodePool (async parallel task execution)
"""

import asyncio
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from lumenis_reactor_core import LumenisReactor, NvidiaReactor, FluxCompass, ITTCouncil, MatonBridge, VanguardNodePool

# ── Global instances ──────────────────────────────────────────────────────────
reactor = LumenisReactor()
nvidia  = NvidiaReactor()
compass = FluxCompass()
bridge  = MatonBridge()
council = ITTCouncil(reactor, compass)
node_pool = VanguardNodePool()

# Active WebSocket connections for broadcasting
_ws_clients: set[WebSocket] = set()


async def broadcast(msg: dict):
    dead = set()
    for ws in _ws_clients:
        try:
            await ws.send_json(msg)
        except Exception:
            dead.add(ws)
    _ws_clients.difference_update(dead)


@reactor.on_pulse
async def on_pulse(status):
    """Broadcast reactor heartbeat to all connected clients."""
    await broadcast(
        {
            "type": "pulse",
            "data": {
                **reactor.get_status(),
                **node_pool.get_status(),
                **compass.get_stats(),
            },
        }
    )


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await reactor.start()
    print("✦ Sovereign Core online — Thermal Baseline 0.18°C")
    yield
    await reactor.stop()


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Sovereign Agentic Core", lifespan=lifespan)

STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", response_class=HTMLResponse)
async def root():
    return (STATIC_DIR / "index.html").read_text()


# ── REST: Status ──────────────────────────────────────────────────────────────
@app.get("/api/status")
async def status():
    from lumenis_reactor_core.itt import SEATS
    return {
        "reactor": reactor.get_status(),
        "nvidia": nvidia.get_status(),
        "oracle_reactor": council.oracle_reactor.get_status(),
        "forge_reactor": council.forge_reactor.get_status(),
        "nodes": node_pool.get_status(),
        "compass": compass.get_stats(),
        "maton": bridge.get_status(),
        "seats": [
            {"key": k, "name": v["name"], "role": v["role"]}
            for k, v in SEATS.items()
        ],
    }


@app.get("/api/sessions")
async def list_sessions():
    return compass.list_sessions(limit=20)


@app.post("/api/sessions")
async def create_session(body: dict = None):
    title = (body or {}).get("title", "New Session")
    sid = compass.create_session(title)
    return {"session_id": sid}


@app.get("/api/sessions/{session_id}/history")
async def get_history(session_id: str):
    return compass.get_history(session_id, limit=50)


@app.get("/api/sessions/{session_id}/facts")
async def get_facts(session_id: str):
    return compass.get_all_facts(session_id)


@app.post("/api/facts")
async def store_fact(body: dict):
    fid = compass.store_fact(
        key=body["key"],
        value=body["value"],
        session_id=body.get("session_id"),
    )
    return {"fact_id": fid}


@app.get("/api/tasks")
async def get_tasks():
    return node_pool.get_recent_tasks(limit=20)


# ── WebSocket: Real-time chat ─────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    _ws_clients.add(ws)

    # Send initial state
    await ws.send_json(
        {
            "type": "init",
            "data": {
                "reactor": reactor.get_status(),
                "nodes": node_pool.get_status(),
                "compass": compass.get_stats(),
            },
        }
    )

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            action = msg.get("action")

            if action == "chat":
                await handle_chat(ws, msg)

            elif action == "new_session":
                sid = compass.create_session(msg.get("title", "New Session"))
                await ws.send_json({"type": "session_created", "session_id": sid})

            elif action == "recall":
                facts = compass.recall_facts(msg.get("query", ""))
                await ws.send_json({"type": "recall_result", "facts": facts})

            elif action == "store_fact":
                fid = compass.store_fact(
                    key=msg["key"],
                    value=msg["value"],
                    session_id=msg.get("session_id"),
                )
                await ws.send_json({"type": "fact_stored", "fact_id": fid})

    except WebSocketDisconnect:
        _ws_clients.discard(ws)
    except Exception as e:
        await ws.send_json({"type": "error", "message": str(e)})
        _ws_clients.discard(ws)


async def handle_chat(ws: WebSocket, msg: dict):
    """Process a chat message through the ITT Council."""
    user_text = msg.get("message", "").strip()
    session_id = msg.get("session_id")

    if not user_text:
        return

    # Create session if not provided
    if not session_id:
        session_id = compass.create_session("Auto Session")
        await ws.send_json({"type": "session_created", "session_id": session_id})

    # Persist user message
    compass.add_message(session_id, "user", user_text)

    # Signal processing start
    await ws.send_json({"type": "processing_start", "session_id": session_id})

    # Streaming callback: sends seat activity and response chunks to the client
    # Gracefully handles client disconnects mid-reasoning (RuntimeError from closed WS)
    async def stream_cb(seat: str, text: str):
        try:
            if seat == "response":
                await ws.send_json({"type": "response_chunk", "text": text})
            else:
                await ws.send_json({"type": "seat_activity", "seat": seat, "text": text})
        except (RuntimeError, Exception):
            pass  # Client disconnected while reasoning model was still thinking

    # Run through the council in the node pool
    async def council_task():
        return await council.process(
            user_message=user_text,
            session_id=session_id,
            stream_cb=stream_cb,
        )

    node = await node_pool.run("council.process", council_task())

    # Wait for the task to finish (it streams results via callback, but we
    # need the final decision object for persistence)
    while node.state.value in ("idle", "active"):
        await asyncio.sleep(0.05)

    if node.state.value == "error":
        await ws.send_json({"type": "error", "message": node.error})
        return

    decision = node.result

    # Persist assistant message
    compass.add_message(session_id, "assistant", decision.final_response, "weaver")

    # Send completion metadata (client may have disconnected during long reasoning)
    try:
      await ws.send_json(
        {
            "type": "processing_done",
            "session_id": session_id,
            "meta": {
                "intent": decision.intent,
                "complexity": decision.complexity,
                "seats_activated": decision.seats_activated,
                "plan": decision.plan,
                "risk_level": decision.risk_level,
                "external_data": bool(decision.external_data),
            },
        }
    )
    except (RuntimeError, Exception):
        pass  # Client disconnected before completion could be sent


# ── Frontier #3: Human-Centered Design — Serve v8 HUD ────────────────────────
@app.get("/hud", response_class=HTMLResponse)
async def serve_hud():
    """Serve the Lumenis v8.0 Cyberpunk Spatial HUD."""
    hud_path = Path(__file__).parent / "lumenis-v8-hud.html"
    if hud_path.exists():
        return HTMLResponse(content=hud_path.read_text())
    return HTMLResponse(content="<h1>HUD not found</h1>", status_code=404)


# ── Frontier #1: Advanced AI — Confidence & model info ───────────────────────
@app.get("/api/intelligence")
async def get_intelligence():
    """Return current model configuration and learning trajectory."""
    traj = compass.get_learning_trajectory()
    status = reactor.get_status()
    return JSONResponse({
        "primary_model": status.get("model"),
        "thermal_baseline": status.get("temperature"),
        "tokens_streamed": status.get("tokens_streamed"),
        "learning": traj,
        "frontiers": {
            "advanced_ai": "90B primary, 11B secondary (upgraded)",
            "autonomous_learning": f"{traj['auto_learned']} auto-facts from {traj['total_facts']} total",
            "human_centered": "v8.0 HUD at /hud",
            "external_integration": "13 Maton services connected",
        }
    })


# ── Frontier #4: Autonomous Learning — trajectory endpoint ───────────────────
@app.get("/api/learning")
async def get_learning():
    return JSONResponse(compass.get_learning_trajectory())


# ── Frontier #2: External Integration — NLP intent parser ────────────────────
@app.post("/api/nlp/intent")
async def parse_intent(payload: dict):
    """
    Lightweight NLP: parse a voice/text command into structured intent.
    Uses the council's navigator seat logic without full processing.
    """
    text = payload.get("text", "").strip()
    if not text:
        return JSONResponse({"error": "no text provided"}, status_code=400)

    # Keyword-based intent classification (fast, no LLM call)
    intents = {
        "system_status": ["status", "health", "online", "how", "running"],
        "memory_recall": ["remember", "recall", "what did", "history", "facts"],
        "arcade_game": ["play", "game", "chess", "go", "arcade"],
        "chat": ["hello", "hi", "talk", "tell me", "what", "who", "explain"],
        "task": ["create", "build", "make", "add", "update", "delete", "push"],
        "voice_control": ["open", "close", "show", "hide", "panel", "hud"],
    }
    text_lower = text.lower()
    detected = "chat"
    for intent, keywords in intents.items():
        if any(k in text_lower for k in keywords):
            detected = intent
            break

    return JSONResponse({
        "text": text,
        "intent": detected,
        "confidence": 0.8,
        "action": f"route_to_{detected}",
    })
