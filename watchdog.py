#!/usr/bin/env python3
"""
One2lvOS Watchdog
=================
Monitors the Lumenis Reactor Core (port 8000) every 60 seconds.
Auto-restarts it via uvicorn if it stops responding.
Logs all restart events to compass.db as facts.

Usage:
    python3 watchdog.py &          # background daemon
    nohup python3 watchdog.py &    # detached
"""

import asyncio
import json
import os
import signal
import sqlite3
import subprocess
import sys
import time
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR   = Path(__file__).parent
COMPASS_DB = os.environ.get("COMPASS_DB", str(ROOT_DIR / "compass.db"))
LOG_FILE   = ROOT_DIR / "logs" / "watchdog.log"

REACTOR_PORT   = int(os.environ.get("PORT", 8000))
REACTOR_CMD    = [
    sys.executable, "-m", "uvicorn", "lumenis-main:app",
    "--host", "0.0.0.0", "--port", str(REACTOR_PORT)
]
CHECK_INTERVAL = 60   # seconds between health checks
STARTUP_GRACE  = 8    # seconds to wait after restart before re-checking

_reactor_proc = None
_running      = True


# ── logging ──────────────────────────────────────────────────────────────────

def ts():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def log(msg: str):
    line = f"[{ts()}] {msg}"
    print(line, flush=True)
    try:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass


# ── compass.db fact logging ───────────────────────────────────────────────────

def store_fact(key: str, value: str):
    try:
        conn = sqlite3.connect(COMPASS_DB)
        conn.execute(
            "INSERT OR REPLACE INTO facts (id, key, value, source, created_at) VALUES (?,?,?,?,?)",
            (str(uuid.uuid4()), key, value, "watchdog", time.time())
        )
        conn.commit()
        conn.close()
    except Exception as e:
        log(f"compass.db write error: {e}")


# ── reactor health check ──────────────────────────────────────────────────────

def reactor_alive() -> bool:
    try:
        req = urllib.request.Request(
            f"http://localhost:{REACTOR_PORT}/api/status",
            headers={"User-Agent": "One2lvOS-Watchdog/1.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status == 200
    except Exception:
        return False


# ── reactor start / restart ───────────────────────────────────────────────────

def start_reactor() -> subprocess.Popen:
    log(f"Starting reactor: {' '.join(REACTOR_CMD)}")
    env = {**os.environ, "PYTHONUNBUFFERED": "1"}
    log_path = ROOT_DIR / "logs" / "reactor.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_path, "a") as lf:
        proc = subprocess.Popen(
            REACTOR_CMD,
            cwd=str(ROOT_DIR),
            env=env,
            stdout=lf,
            stderr=lf,
        )
    log(f"Reactor started — PID {proc.pid}")
    return proc


def stop_reactor(proc: subprocess.Popen):
    if proc and proc.poll() is None:
        log(f"Stopping reactor PID {proc.pid}")
        proc.terminate()
        try:
            proc.wait(timeout=8)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()


# ── graceful shutdown ─────────────────────────────────────────────────────────

def handle_signal(sig, frame):
    global _running
    log(f"Watchdog received signal {sig} — shutting down")
    _running = False
    stop_reactor(_reactor_proc)
    sys.exit(0)


signal.signal(signal.SIGTERM, handle_signal)
signal.signal(signal.SIGINT,  handle_signal)


# ── main loop ─────────────────────────────────────────────────────────────────

def main():
    global _reactor_proc, _running

    log("=== ONE2LVOS WATCHDOG START ===")
    log(f"Monitoring reactor on port {REACTOR_PORT} every {CHECK_INTERVAL}s")
    store_fact("watchdog.start", json.dumps({"ts": ts(), "port": REACTOR_PORT}))

    # Start reactor immediately if not running
    if not reactor_alive():
        log("Reactor not running on startup — starting now")
        _reactor_proc = start_reactor()
        time.sleep(STARTUP_GRACE)
    else:
        log("Reactor already alive — watchdog monitoring only")

    restart_count = 0

    while _running:
        time.sleep(CHECK_INTERVAL)

        # Check if managed process died
        if _reactor_proc and _reactor_proc.poll() is not None:
            exit_code = _reactor_proc.returncode
            log(f"Reactor process exited (code {exit_code}) — restarting")
            restart_count += 1
            store_fact(
                f"watchdog.restart.{int(time.time())}",
                json.dumps({"ts": ts(), "reason": "process_exited", "code": exit_code, "count": restart_count})
            )
            _reactor_proc = start_reactor()
            time.sleep(STARTUP_GRACE)
            continue

        # HTTP health check
        if not reactor_alive():
            log("Reactor not responding to HTTP — restarting")
            stop_reactor(_reactor_proc)
            restart_count += 1
            store_fact(
                f"watchdog.restart.{int(time.time())}",
                json.dumps({"ts": ts(), "reason": "http_timeout", "count": restart_count})
            )
            _reactor_proc = start_reactor()
            time.sleep(STARTUP_GRACE)
        else:
            log(f"Reactor alive (restarts: {restart_count})")
            store_fact("watchdog.ping", json.dumps({"ts": ts(), "alive": True, "restarts": restart_count}))


if __name__ == "__main__":
    main()
