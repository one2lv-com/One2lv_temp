#!/usr/bin/env python3
"""
One2lvOS Heartbeat
==================
Runs every 30 minutes. Does three things:
  1. Fetches moltbook.com/heartbeat.md and follows its instructions
  2. Sends a pulse to Lumenis (ITT Council) for a status check
  3. Stores both results in Astra DB vector memory

Triggered by: cron, systemd, or the Claude scheduler
"""

import asyncio
import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ── env ───────────────────────────────────────────────────────────────────────
BUILD_DIR = Path(__file__).parent
sys.path.insert(0, str(BUILD_DIR))

try:
    from dotenv import load_dotenv
    load_dotenv(BUILD_DIR / ".env")
except Exception:
    pass

NVIDIA_KEY   = os.environ.get("NVIDIA_API_KEY", "")
MCP_BASE     = "http://localhost:8003/mcp"
LUMENIS_WS   = "ws://localhost:3003/ws"
MOLTBOOK_HB  = "https://www.moltbook.com/heartbeat.md"
LOG_FILE     = Path("/tmp/one2lvos_heartbeat.log")

# ── helpers ───────────────────────────────────────────────────────────────────

def log(msg: str):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def _mcp_call(tool: str, args: dict) -> str:
    payload = json.dumps({
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {"name": tool, "arguments": args}
    }).encode()
    req = urllib.request.Request(MCP_BASE, data=payload,
                                  headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            d = json.loads(r.read())
            return d["result"]["content"][0]["text"]
    except Exception as e:
        return f"MCP error: {e}"


def fetch_moltbook_heartbeat() -> str:
    """Fetch moltbook.com/heartbeat.md — follow its instructions."""
    try:
        req = urllib.request.Request(MOLTBOOK_HB,
            headers={"User-Agent": "One2lvOS-Heartbeat/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            content = r.read().decode("utf-8", errors="replace")
            return content[:2000]
    except Exception as e:
        return f"Moltbook heartbeat fetch error: {e}"


def check_moltbook_feed() -> str:
    """Get latest Moltbook posts."""
    return _mcp_call("moltbook_feed", {"sort": "new", "limit": 5})


def check_network_status() -> str:
    """Check One2lvOS gateway status."""
    try:
        req = urllib.request.Request("http://localhost:8888/status",
            headers={"User-Agent": "One2lvOS-Heartbeat/1.0"})
        with urllib.request.urlopen(req, timeout=5) as r:
            d = json.loads(r.read())
            online = d.get("online", 0)
            total = d.get("total", 0)
            return f"{online}/{total} services online"
    except Exception as e:
        return f"Gateway unreachable: {e}"


async def pulse_lumenis(message: str) -> str:
    """Send a heartbeat pulse to Lumenis and get a response."""
    try:
        import websockets
        async with websockets.connect(LUMENIS_WS, ping_interval=None) as ws:
            await asyncio.wait_for(ws.recv(), timeout=5)
            await ws.send(json.dumps({"action": "chat", "message": message}))
            full = ""
            while True:
                raw = await asyncio.wait_for(ws.recv(), timeout=45.0)
                msg = json.loads(raw)
                t = msg.get("type", "")
                if t == "response_chunk":
                    full += msg.get("text", "")
                elif t == "processing_done":
                    break
                elif t == "error":
                    return f"Lumenis error: {msg.get('message', msg)}"
            return full.strip()
    except ImportError:
        return "websockets not installed"
    except asyncio.TimeoutError:
        return "Lumenis timeout"
    except Exception as e:
        return f"Lumenis unreachable: {e}"


def store_memory(text: str, doc_type: str, tags: str):
    """Store a heartbeat result in Astra DB."""
    return _mcp_call("memory_store", {
        "text": text,
        "doc_type": doc_type,
        "tags": tags,
    })


async def run_heartbeat():
    ts = datetime.now(timezone.utc).isoformat()
    log("=== ONE2LVOS HEARTBEAT START ===")

    # 1. Network status
    net = check_network_status()
    log(f"Network: {net}")

    # 2. Moltbook heartbeat.md
    log("Fetching Moltbook heartbeat.md...")
    hb_content = fetch_moltbook_heartbeat()
    log(f"Moltbook heartbeat: {hb_content[:200]}")

    # 3. Moltbook feed
    log("Checking Moltbook feed (new)...")
    feed = check_moltbook_feed()
    log(f"Feed: {feed[:200]}")

    # 4. Lumenis pulse
    if NVIDIA_KEY:
        pulse_msg = (
            f"Heartbeat pulse at {ts}. "
            f"Network: {net}. "
            f"Moltbook is active. "
            f"Give a brief status check — how is the system running?"
        )
        log("Pulsing Lumenis...")
        lumenis_response = await pulse_lumenis(pulse_msg)
        log(f"Lumenis: {lumenis_response[:200]}")
    else:
        lumenis_response = "NVIDIA_API_KEY not set — Lumenis skipped"
        log(lumenis_response)

    # 5. Store heartbeat in memory
    memory_text = (
        f"Heartbeat at {ts}. "
        f"Network: {net}. "
        f"Moltbook heartbeat fetched. "
        f"Lumenis pulse: {lumenis_response[:300]}"
    )
    result = store_memory(memory_text, "heartbeat", "heartbeat,pulse,status")
    log(f"Memory: {result.split(chr(10))[0]}")
    log("=== HEARTBEAT COMPLETE ===\n")


if __name__ == "__main__":
    os.environ["NVIDIA_API_KEY"] = NVIDIA_KEY or os.environ.get("NVIDIA_API_KEY", "")
    asyncio.run(run_heartbeat())
