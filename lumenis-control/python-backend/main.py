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
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from core import (

# ── Input validation models ───────────────────────────────────────────────
from pydantic import BaseModel, Field

class SessionCreate(BaseModel):
    title: str = Field(default="New Session", max_length=200)

class FactCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=200)
    value: str = Field(..., max_length=10000)
    session_id: str | None = None


    LumenisReactor,
    NvidiaReactor,
    NemotronReactor,
    GemmaReactor,
    NemotronSuperReactor,
    MinimaxReactor,
    StepFunReactor,
    KimiReactor,
    UnifiedNvidiaReactor,
    FluxCompass,
    ITTCouncil,
    MatonBridge,
    VanguardNodePool
)

# ── Global instances ──────────────────────────────────────────────────────────
reactor = LumenisReactor()
nvidia  = NvidiaReactor()  # Gemma-4-31B-IT (backward compat)
nemotron = NemotronReactor()  # Nemotron-Mini-4B-Instruct (fast)
gemma = GemmaReactor()  # Gemma-4-31B-IT (reasoning)
nemotron_super = NemotronSuperReactor()  # Nemotron-3-Super-120B (ultra)
minimax = MinimaxReactor()  # MiniMax-M2.7 (balanced)
stepfun = StepFunReactor()  # Step-3.5-Flash (flash reasoning)
kimi = KimiReactor()  # Moonshot AI Kimi K2.6 (advanced reasoning)
unified_nvidia = UnifiedNvidiaReactor()  # Auto-routing
compass = FluxCompass()
bridge  = MatonBridge()
council = ITTCouncil(reactor, compass)
node_pool = VanguardNodePool()

# Active WebSocket connections for broadcasting
_ws_clients: set[WebSocket] = set()


def build_manifold_snapshot() -> dict:
    return {
        "reactor": reactor.get_status(),
        "nodes": node_pool.get_status(),
        "compass": compass.get_stats(),
        "maton": bridge.get_status(),
    }


class ConnectionManager:
    def __init__(self):
        self.active_connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        await self.send_personal_json(
            websocket,
            {
                "type": "manifold_state",
                "message": "Persistent manifold linked.",
                "data": build_manifold_snapshot(),
            },
        )
        print(f"[CORE] New persistent node linked: {websocket.client}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        print("[CORE] Node disconnected from manifold.")

    async def send_personal_json(self, websocket: WebSocket, payload: dict):
        await websocket.send_json(payload)

    async def broadcast_json(self, payload: dict):
        dead = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(payload)
            except Exception:
                dead.add(connection)
        for connection in dead:
            self.disconnect(connection)


vanguard_manager = ConnectionManager()


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
    snapshot = build_manifold_snapshot()
    await broadcast(
        {
            "type": "pulse",
            "data": snapshot,
        }
    )
    await vanguard_manager.broadcast_json(
        {
            "type": "pulse",
            "ts": time.time(),
            "data": snapshot,
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
    from core.itt import SEATS
    return {
        "reactor": reactor.get_status(),
        "nvidia_reactors": {
            "nemotron_mini": nemotron.get_status(),
            "gemma": gemma.get_status(),
            "nemotron_super": nemotron_super.get_status(),
            "minimax": minimax.get_status(),
            "stepfun": stepfun.get_status(),
            "kimi": kimi.get_status(),
            "unified": unified_nvidia.get_status(),
            "legacy": nvidia.get_status()  # backward compat
        },
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
async def create_session(body: SessionCreate = None):
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
async def store_fact(body: FactCreate):
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


@app.websocket("/ws/vanguard")
async def vanguard_endpoint(websocket: WebSocket):
    await vanguard_manager.connect(websocket)

    try:
        while True:
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=25)
            except asyncio.TimeoutError:
                await vanguard_manager.send_personal_json(
                    websocket,
                    {"type": "ping", "ts": time.time()},
                )
                continue

            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                await vanguard_manager.send_personal_json(
                    websocket,
                    {
                        "type": "telemetry_echo",
                        "ts": time.time(),
                        "message": raw,
                    },
                )
                continue

            message_type = message.get("type", "telemetry")
            source = message.get("source", "client")

            if message_type in {"heartbeat", "ping"}:
                await vanguard_manager.send_personal_json(
                    websocket,
                    {
                        "type": "pong",
                        "ts": time.time(),
                        "data": {
                            "frequency_hz": reactor.get_status()["frequency_hz"],
                            "source": source,
                        },
                    },
                )
                continue

            if message_type == "terminal_command":
                await vanguard_manager.broadcast_json(
                    {
                        "type": "telemetry_echo",
                        "ts": time.time(),
                        "source": source,
                        "message": f"Terminal command received: {message.get('command', '')}",
                    }
                )
                continue

            await vanguard_manager.broadcast_json(
                {
                    "type": "telemetry_echo",
                    "ts": time.time(),
                    "source": source,
                    "message": message,
                }
            )

    except WebSocketDisconnect:
        vanguard_manager.disconnect(websocket)
    except Exception as e:
        await vanguard_manager.send_personal_json(
            websocket,
            {"type": "error", "message": str(e)},
        )
        vanguard_manager.disconnect(websocket)


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
    async def stream_cb(seat: str, text: str):
        if seat == "response":
            await ws.send_json({"type": "response_chunk", "text": text})
        else:
            await ws.send_json({"type": "seat_activity", "seat": seat, "text": text})

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

    # Send completion metadata
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
