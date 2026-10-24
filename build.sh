#!/usr/bin/env bash
# =============================================================================
#  One2lvOS — Unified System Build & Launch Script
#  Copyright (c) 2026 one2lv-com (MIT License)
# =============================================================================
#
#  Usage:
#    ./build.sh              — full build + start all services
#    ./build.sh deps         — install dependencies only
#    ./build.sh start        — start services (skip build)
#    ./build.sh stop         — stop all services
#    ./build.sh status       — show service health
#    ./build.sh restart      — stop then start
#    ./build.sh logs [svc]   — tail logs (all or named service)
#
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/tmp/one2lv-logs"
mkdir -p "$LOG_DIR"

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
ok()   { echo -e "  ${GREEN}✓${RESET}  $*"; }
fail() { echo -e "  ${RED}✗${RESET}  $*"; }
info() { echo -e "  ${CYAN}→${RESET}  $*"; }
warn() { echo -e "  ${YELLOW}!${RESET}  $*"; }

banner() {
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}"
  printf "${BOLD}${CYAN}║  %-60s  ║${RESET}\n" "$1"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}"
  echo ""
}

# ── Port / process helpers ────────────────────────────────────────────────────
kill_port() {
  local port=$1
  local pids
  pids=$(fuser "${port}/tcp" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
    sleep 0.5
  fi
}

wait_up() {
  local name=$1 url=$2 tries=${3:-15}
  for i in $(seq 1 $tries); do
    if curl -sf "$url" > /dev/null 2>&1; then
      ok "$name is up  ($url)"
      return 0
    fi
    sleep 1
  done
  fail "$name did not respond at $url after ${tries}s"
  return 1
}

# ── Python venv / pip helper ──────────────────────────────────────────────────
pip_install() {
  local req=$1
  info "pip install -r $req"
  pip3 install -q -r "$req" 2>/dev/null || warn "some packages may have failed (non-fatal)"
}

# =============================================================================
#  DEPS — install all dependencies
# =============================================================================
cmd_deps() {
  banner "Installing Dependencies"

  # ── Python system packages ───────────────────────────────────────────────
  info "Python packages (shared)"
  pip3 install -q fastapi uvicorn flask requests anthropic websockets 2>/dev/null || true

  # ── ai-arcade ────────────────────────────────────────────────────────────
  if [ -f "$ROOT/ai-arcade/requirements.txt" ]; then
    info "ai-arcade"
    pip_install "$ROOT/ai-arcade/requirements.txt"
  fi

  # ── One2lvos core ────────────────────────────────────────────────────────
  if [ -f "$ROOT/One2lvos/requirements.txt" ]; then
    info "One2lvos"
    pip_install "$ROOT/One2lvos/requirements.txt"
  fi

  # ── sovereign-agentic-core ───────────────────────────────────────────────
  if [ -f "$ROOT/sovereign-agentic-core/requirements.txt" ]; then
    info "sovereign-agentic-core"
    pip_install "$ROOT/sovereign-agentic-core/requirements.txt"
  fi

  # ── control-plane-compilers ──────────────────────────────────────────────
  if [ -f "$ROOT/control-plane-compilers/requirements.txt" ]; then
    info "control-plane-compilers"
    pip_install "$ROOT/control-plane-compilers/requirements.txt"
  fi

  # ── steamos dashboard ────────────────────────────────────────────────────
  if [ -f "$ROOT/steamos_lumenis/one2lvos_dashboard/requirements.txt" ]; then
    info "steamos dashboard"
    pip_install "$ROOT/steamos_lumenis/one2lvos_dashboard/requirements.txt"
  fi

  # ── minimax agent-hub (Vite/React — MiniMax via NVIDIA NIM) ─────────────
  if [ -f "$ROOT/minimax/agent-hub/package.json" ]; then
    info "minimax/agent-hub"
    (cd "$ROOT/minimax/agent-hub" && npm install --silent 2>/dev/null) || true
  fi

  # ── minimax one2lv-agent-hub (Vite/React) ────────────────────────────────
  if [ -f "$ROOT/minimax/one2lv-agent-hub/package.json" ]; then
    info "minimax/one2lv-agent-hub"
    (cd "$ROOT/minimax/one2lv-agent-hub" && npm install --silent 2>/dev/null) || true
  fi

  # ── minimax witness proxy ────────────────────────────────────────────────
  if [ -f "$ROOT/minimax/one2lv-witness-v8/proxy/package.json" ]; then
    info "minimax/witness-proxy"
    (cd "$ROOT/minimax/one2lv-witness-v8/proxy" && npm install --silent 2>/dev/null) || true
  fi

  # ── minimax core server ──────────────────────────────────────────────────
  if [ -f "$ROOT/minimax/package.json" ]; then
    info "minimax (core)"
    (cd "$ROOT/minimax" && npm install --silent 2>/dev/null) || true
  fi

  # ── lumenis-v7-cjs (Node.js) ─────────────────────────────────────────────
  if [ -f "$ROOT/steamos_lumenis/lumenis-v7-cjs/package.json" ]; then
    info "lumenis-v7-cjs"
    (cd "$ROOT/steamos_lumenis/lumenis-v7-cjs" && npm install --silent 2>/dev/null) || true
  fi

  # ── lumenis-os (pnpm monorepo) ────────────────────────────────────────────
  if [ -f "$ROOT/lumenis-os/package.json" ]; then
    info "lumenis-os (pnpm install)"
    (cd "$ROOT/lumenis-os" && pnpm install --silent 2>/dev/null) || \
    (cd "$ROOT/lumenis-os" && npm install --silent 2>/dev/null) || true
    info "lumenis-os api-server (pnpm install)"
    (cd "$ROOT/lumenis-os/artifacts/api-server" && pnpm install --silent 2>/dev/null) || true
  fi

  ok "All dependencies installed"
}

# =============================================================================
#  BUILD — compile TypeScript / bundled assets
# =============================================================================
cmd_build() {
  banner "Building Projects"

  # ── lumenis-os api-server ─────────────────────────────────────────────────
  if [ -f "$ROOT/lumenis-os/artifacts/api-server/build.mjs" ]; then
    info "lumenis-os api-server (esbuild)"
    (cd "$ROOT/lumenis-os/artifacts/api-server" && node ./build.mjs) \
      && ok "lumenis-os api-server built → dist/index.mjs" \
      || fail "lumenis-os api-server build failed"
  fi

  # ── minimax agent-hub (Vite — bakes NVIDIA key + minimax/minimax-01) ─────
  if [ -f "$ROOT/minimax/agent-hub/package.json" ]; then
    info "minimax/agent-hub (vite build)"
    (cd "$ROOT/minimax/agent-hub" && npm run build 2>/dev/null) \
      && ok "minimax/agent-hub built → dist/" \
      || warn "minimax/agent-hub build failed (non-fatal)"
  fi

  # ── minimax one2lv-agent-hub (Vite) ──────────────────────────────────────
  if [ -f "$ROOT/minimax/one2lv-agent-hub/package.json" ]; then
    info "minimax/one2lv-agent-hub (vite build)"
    (cd "$ROOT/minimax/one2lv-agent-hub" && npm run build 2>/dev/null) \
      && ok "minimax/one2lv-agent-hub built → dist/" \
      || warn "minimax/one2lv-agent-hub build failed (non-fatal)"
  fi

  ok "Build complete"
}

# =============================================================================
#  START — launch all services
# =============================================================================
cmd_start() {
  banner "Starting All Services"

  # ── 1. AI Arcade MCP (port 8003) ─────────────────────────────────────────
  info "AI Arcade MCP  [port 8003]"
  kill_port 8003
  PYTHONPATH="$ROOT/ai-arcade" \
    nohup python3 "$ROOT/ai-arcade/server.py" \
    > "$LOG_DIR/ai-arcade.log" 2>&1 &
  echo $! > "$LOG_DIR/ai-arcade.pid"
  wait_up "AI Arcade MCP" "http://localhost:8003" 10 || true

  # ── 2. One2lvOS Core (port 3002) ─────────────────────────────────────────
  info "One2lvOS Core  [port 3002]"
  kill_port 3002
  PYTHONPATH="$ROOT/One2lvos" \
    nohup python3 -m flask run \
      --host 0.0.0.0 --port 3002 \
      --app "$ROOT/One2lvos/core_service.py" \
    > "$LOG_DIR/os-core.log" 2>&1 &
  echo $! > "$LOG_DIR/os-core.pid"
  wait_up "One2lvOS Core" "http://localhost:3002/health" 12 || true

  # ── 3. Sovereign Agentic Core (port 3003) ────────────────────────────────
  info "Sovereign Agentic Core  [port 3003]"
  kill_port 3003
  PYTHONPATH="$ROOT/sovereign-agentic-core:$ROOT/control-plane-compilers/src" \
    nohup python3 -m uvicorn main:app \
      --host 0.0.0.0 --port 3003 --log-level warning \
      --app-dir "$ROOT/sovereign-agentic-core" \
    > "$LOG_DIR/sac.log" 2>&1 &
  echo $! > "$LOG_DIR/sac.pid"
  wait_up "Sovereign Agentic Core" "http://localhost:3003/api/status" 15 || true

  # ── 4. Lumenis v7 Cosmic (port 8005) ─────────────────────────────────────
  info "Lumenis v7 Cosmic  [port 8005]"
  kill_port 8005
  PORT=8005 nohup node "$ROOT/steamos_lumenis/lumenis-v7-cjs/server.js" \
    > "$LOG_DIR/lumenis-v7.log" 2>&1 &
  echo $! > "$LOG_DIR/lumenis-v7.pid"
  wait_up "Lumenis v7" "http://localhost:8005" 10 || true

  # ── 5. SteamOS Dashboard (port 8080) ─────────────────────────────────────
  info "SteamOS Dashboard  [port 8080]"
  kill_port 8080
  PYTHONPATH="$ROOT/steamos_lumenis/one2lvos_dashboard" \
    nohup python3 "$ROOT/steamos_lumenis/one2lvos_dashboard/server.py" \
    > "$LOG_DIR/steamos-dash.log" 2>&1 &
  echo $! > "$LOG_DIR/steamos-dash.pid"
  wait_up "SteamOS Dashboard" "http://localhost:8080" 10 || true

  # ── 6. AI Lobby (port 8006) ───────────────────────────────────────────────
  info "AI Lobby  [port 8006]"
  kill_port 8006
  PYTHONPATH="$ROOT:$ROOT/control-plane-compilers/src" \
    nohup python3 -m uvicorn ai_lobby:app \
      --host 0.0.0.0 --port 8006 --log-level warning \
      --app-dir "$ROOT" \
    > "$LOG_DIR/ai-lobby.log" 2>&1 &
  echo $! > "$LOG_DIR/ai-lobby.pid"
  wait_up "AI Lobby" "http://localhost:8006" 12 || true

  # ── 7. Lumenis Space Agent UI (port 9001) ────────────────────────────────
  info "Lumenis Space Agent UI  [port 9001]"
  kill_port 9001
  nohup python3 -m http.server 9001 \
    --directory "$ROOT/Lumenis/frontend" \
    > "$LOG_DIR/lumenis-ui.log" 2>&1 &
  echo $! > "$LOG_DIR/lumenis-ui.pid"
  wait_up "Lumenis UI" "http://localhost:9001" 8 || true

  # ── 8. LumenisOS API Server (port 9002) ──────────────────────────────────
  info "LumenisOS API Server  [port 9002]"
  kill_port 9002
  PORT=9002 nohup node "$ROOT/lumenis-os/artifacts/api-server/dist/index.mjs" \
    > "$LOG_DIR/lumenis-os.log" 2>&1 &
  echo $! > "$LOG_DIR/lumenis-os.pid"
  wait_up "LumenisOS API" "http://localhost:9002/api/healthz" 12 || true

  # ── 9. Aetherix Master Terminal (port 9003) ───────────────────────────────
  info "Aetherix Master Terminal  [port 9003]"
  kill_port 9003
  nohup python3 "$ROOT/Aetherix/server.py" \
    > "$LOG_DIR/aetherix.log" 2>&1 &
  echo $! > "$LOG_DIR/aetherix.pid"
  wait_up "Aetherix" "http://localhost:9003/health" 8 || true

  # ── 10. Unified Gateway (port 8888) ──────────────────────────────────────
  info "Unified Gateway  [port 8888]"
  kill_port 8888
  PYTHONPATH="$ROOT/One2lvos:$ROOT/control-plane-compilers/src" \
    nohup python3 -m uvicorn unified_gateway:app \
      --host 0.0.0.0 --port 8888 --log-level warning \
      --app-dir "$ROOT" \
    > "$LOG_DIR/gateway.log" 2>&1 &
  echo $! > "$LOG_DIR/gateway.pid"
  wait_up "Unified Gateway" "http://localhost:8888/status" 15 || true

  # ── 11. Minimax Core API (port 8080) ─────────────────────────────────────
  if [ -f "$ROOT/minimax/package.json" ] && command -v node >/dev/null 2>&1; then
    info "Minimax Core API  [port 8080]"
    kill_port 8080
    NODE_PORT=8080 nohup node "$ROOT/minimax/index.js" \
      > "$LOG_DIR/minimax.log" 2>&1 &
    echo $! > "$LOG_DIR/minimax.pid"
    wait_up "Minimax Core" "http://localhost:8080/health" 10 || true
  fi

  # ── 12. Minimax Witness Proxy (port 3001) ────────────────────────────────
  if [ -f "$ROOT/minimax/one2lv-witness-v8/proxy/package.json" ] && command -v node >/dev/null 2>&1; then
    info "Minimax Witness Proxy  [port 3001]"
    kill_port 3001
    nohup node "$ROOT/minimax/one2lv-witness-v8/proxy/server.js" \
      > "$LOG_DIR/witness-proxy.log" 2>&1 &
    echo $! > "$LOG_DIR/witness-proxy.pid"
    wait_up "Witness Proxy" "http://localhost:3001/api/health" 10 || true
  fi

  echo ""
  cmd_status
}

# =============================================================================
#  STOP — gracefully stop all services
# =============================================================================
cmd_stop() {
  banner "Stopping All Services"
  for svc in ai-arcade os-core sac lumenis-v7 steamos-dash ai-lobby \
              lumenis-ui lumenis-os aetherix gateway minimax witness-proxy; do
    PID_FILE="$LOG_DIR/${svc}.pid"
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null && ok "Stopped $svc (pid $PID)" || warn "Could not stop $svc"
      else
        warn "$svc was not running"
      fi
      rm -f "$PID_FILE"
    fi
  done
  # Also release ports by name as fallback
  for port in 3001 3002 3003 8003 8005 8006 8080 8888 9001 9002 9003; do
    fuser -k "${port}/tcp" 2>/dev/null || true
  done
  ok "All services stopped"
}

# =============================================================================
#  STATUS — health check all services
# =============================================================================
cmd_status() {
  echo ""
  echo -e "${BOLD}  Service                  Port   Status   URL${RESET}"
  echo    "  ────────────────────────────────────────────────────────────────"

  check_svc() {
    local name="$1" port="$2" url="$3"
    printf "  %-24s  %-5s  " "$name" "$port"
    if curl -sf "$url" > /dev/null 2>&1; then
      echo -e "${GREEN}UP${RESET}       $url"
    else
      echo -e "${RED}DOWN${RESET}     $url"
    fi
  }

  check_svc "AI Arcade MCP"          8003  "http://localhost:8003"
  check_svc "One2lvOS Core"          3002  "http://localhost:3002/health"
  check_svc "Sovereign Agentic Core" 3003  "http://localhost:3003/api/status"
  check_svc "Lumenis v7 Cosmic"      8005  "http://localhost:8005"
  check_svc "SteamOS Dashboard"      8080  "http://localhost:8080"
  check_svc "AI Lobby"               8006  "http://localhost:8006"
  check_svc "Lumenis Space Agent UI" 9001  "http://localhost:9001"
  check_svc "LumenisOS API"          9002  "http://localhost:9002/api/healthz"
  check_svc "Aetherix Terminal"      9003  "http://localhost:9003/health"
  check_svc "Unified Gateway"        8888  "http://localhost:8888/status"
  check_svc "Minimax Core API"       8080  "http://localhost:8080/health"
  check_svc "Minimax Witness Proxy"  3001  "http://localhost:3001/api/health"
  echo ""

  # Agent count from lobby
  local agents
  agents=$(curl -sf "http://localhost:8006/agents" 2>/dev/null \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])" 2>/dev/null || echo "?")
  echo -e "  ${BOLD}AI Lobby agents registered: ${CYAN}${agents}${RESET}"
  echo ""
}

# =============================================================================
#  LOGS — tail logs for a service or all
# =============================================================================
cmd_logs() {
  local svc="${1:-}"
  if [ -n "$svc" ]; then
    tail -f "$LOG_DIR/${svc}.log"
  else
    echo "Available logs:"
    ls "$LOG_DIR"/*.log 2>/dev/null | while read -r f; do
      echo "  $(basename "$f")"
    done
    echo ""
    echo "Usage: $0 logs <service-name>"
    echo "       $0 logs gateway"
  fi
}

# =============================================================================
#  MAIN
# =============================================================================
CMD="${1:-all}"

case "$CMD" in
  deps)    cmd_deps ;;
  build)   cmd_deps && cmd_build ;;
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  status)  cmd_status ;;
  restart) cmd_stop && sleep 1 && cmd_start ;;
  logs)    cmd_logs "${2:-}" ;;
  all|"")
    banner "One2lvOS — Full System Build & Launch"
    echo -e "  ${BOLD}Root:${RESET}  $ROOT"
    echo -e "  ${BOLD}Date:${RESET}  $(date)"
    echo ""
    cmd_deps
    cmd_build
    cmd_start
    echo -e "${BOLD}${GREEN}"
    echo "  ╔══════════════════════════════════════════════════════════════╗"
    echo "  ║   One2lvOS System Ready                                      ║"
    echo "  ║                                                              ║"
    echo "  ║   Unified Gateway  →  http://localhost:8888                  ║"
    echo "  ║   AI Lobby         →  http://localhost:8006                  ║"
    echo "  ║   AI Arcade MCP    →  http://localhost:8003                  ║"
    echo "  ║   Sovereign Core   →  http://localhost:3003                  ║"
    echo "  ║   LumenisOS        →  http://localhost:9002                  ║"
    echo "  ║   Aetherix         →  http://localhost:9003                  ║"
    echo "  ╚══════════════════════════════════════════════════════════════╝"
    echo -e "${RESET}"
    ;;
  *)
    echo "Usage: $0 {all|deps|build|start|stop|restart|status|logs [svc]}"
    exit 1 ;;
esac
