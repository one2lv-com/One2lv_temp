#!/bin/bash
# ONE2LVOS — Unified Startup Script (v2)
# Starts all available services with correct paths

# set -e  # disabled: non-fatal failures should not abort startup

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║      ONE2LVOS SOVEREIGN ARCHITECTURE — FULL SYSTEM BOOT         ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# ── Pre-flight ────────────────────────────────────────────────────────────────
echo -e "${CYAN}[1/5] Pre-flight check...${NC}"
command -v python3 >/dev/null 2>&1 && echo -e "  ${GREEN}✓ python3${NC}" || { echo -e "${RED}✗ python3 missing${NC}"; exit 1; }
command -v node    >/dev/null 2>&1 && echo -e "  ${GREEN}✓ node${NC}"    || echo -e "  ${YELLOW}⚠ node not found (minimax skipped)${NC}"

# ── Load .env ─────────────────────────────────────────────────────────────────
if [ -f "$ROOT_DIR/.env" ]; then
    set -a; source "$ROOT_DIR/.env"; set +a
    echo -e "  ${GREEN}✓ .env loaded${NC}"
else
    echo -e "  ${YELLOW}⚠ .env not found${NC}"
fi
echo ""

# ── Cleanup ───────────────────────────────────────────────────────────────────
echo -e "${CYAN}[2/5] Cleanup previous processes...${NC}"
pkill -f "uvicorn lumenis-main" 2>/dev/null && echo -e "  stopped: reactor" || true
pkill -f "ai_lobby.py"          2>/dev/null && echo -e "  stopped: lobby"   || true
sleep 1
echo -e "  ${GREEN}✓ cleanup done${NC}"
echo ""

# ── Logs dir ──────────────────────────────────────────────────────────────────
mkdir -p "$ROOT_DIR/logs"

# ── [3] Lumenis Reactor Core ─────────────────────────────────────────────────
echo -e "${CYAN}[3/5] Starting Lumenis Reactor Core (port 8000)...${NC}"
nohup python3 -m uvicorn lumenis-main:app --host 0.0.0.0 --port 8000 \
    > "$ROOT_DIR/logs/reactor.log" 2>&1 &
REACTOR_PID=$!
echo -e "  PID: $REACTOR_PID"
sleep 4
if curl -s http://localhost:8000/api/status >/dev/null 2>&1; then
    MODEL=$(curl -s http://localhost:8000/api/status | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['reactor']['model'].split('/')[-1])" 2>/dev/null)
    echo -e "  ${GREEN}✓ Reactor online — model: $MODEL${NC}"
else
    echo -e "  ${RED}✗ Reactor not responding — check logs/reactor.log${NC}"
fi
echo ""

# ── [4] AI Lobby ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[4/5] Starting AI Lobby (port 8006)...${NC}"
nohup python3 "$ROOT_DIR/ai_lobby.py" \
    > "$ROOT_DIR/logs/lobby.log" 2>&1 &
LOBBY_PID=$!
echo -e "  PID: $LOBBY_PID"
sleep 3
if curl -s http://localhost:8006/ >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓ AI Lobby online${NC}"
    # Auto-register Lumenis in the lobby
    REG=$(curl -s -X POST http://localhost:8000/api/tools/lobby/register -H "Content-Type: application/json" -d '{}' 2>/dev/null)
    echo -e "  ${GREEN}✓ Lumenis registered in lobby${NC}"
else
    echo -e "  ${YELLOW}⚠ Lobby not responding — check logs/lobby.log${NC}"
fi
echo ""

# ── [5] Minimax (optional — requires npm install) ─────────────────────────────
echo -e "${CYAN}[5/5] Minimax AI System (port 8080)...${NC}"
if [ -d "$ROOT_DIR/minimax/node_modules" ] && command -v node >/dev/null 2>&1; then
    cd "$ROOT_DIR/minimax"
    nohup node index.js > "$ROOT_DIR/logs/minimax.log" 2>&1 &
    MINIMAX_PID=$!
    echo -e "  PID: $MINIMAX_PID"
    sleep 3
    if curl -s http://localhost:8080/ >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Minimax online${NC}"
    else
        echo -e "  ${YELLOW}⚠ Minimax not responding${NC}"
    fi
    cd "$ROOT_DIR"
else
    echo -e "  ${YELLOW}⚠ Minimax skipped (run: cd minimax && npm install)${NC}"
fi
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                ONE2LVOS — SYSTEM STATUS                         ║"
echo "╠══════════════════════════════════════════════════════════════════╣"

check_port() {
    local name=$1 port=$2 path=$3
    if curl -s --max-time 2 "http://localhost:$port$path" >/dev/null 2>&1; then
        printf "║  %-30s %s %-20s║\n" "$name" "$(echo -e "${GREEN}ONLINE${NC}")" ":$port"
    else
        printf "║  %-30s %s %-20s║\n" "$name" "$(echo -e "${RED}OFFLINE${NC}")" ":$port"
    fi
}

check_port "Lumenis Reactor Core"    8000 "/api/status"
check_port "  Chat UI"               8000 "/lumenis-chat"
check_port "  Tool Registry (21)"    8000 "/api/tools/registry"
check_port "AI Lobby"                8006 "/"
check_port "Minimax AI"              8080 "/"

echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  Logs:  tail -f logs/reactor.log  |  tail -f logs/lobby.log    ║"
echo "║  Stop:  ./stop-all.sh                                           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Access Lumenis: http://localhost:8000/lumenis-chat${NC}"
echo ""
