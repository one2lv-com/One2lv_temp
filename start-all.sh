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

# ── [6] Aetherix Browser OS (port 8086) ──────────────────────────────────────
echo -e "${CYAN}[6/9] Starting Aetherix Browser OS (port 8086)...${NC}"
AETHERIX_DIR="$ROOT_DIR/Aetherix"
if [ -f "$AETHERIX_DIR/server.py" ]; then
    cd "$AETHERIX_DIR"
    nohup python3 server.py > "$ROOT_DIR/logs/aetherix.log" 2>&1 &
    echo -e "  PID: $!"
    sleep 3
    if curl -s http://localhost:8086/ >/dev/null 2>&1 || curl -s http://localhost:3000/ >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Aetherix online${NC}"
    else
        echo -e "  ${YELLOW}⚠ Aetherix starting (check logs/aetherix.log)${NC}"
    fi
    cd "$ROOT_DIR"
else
    echo -e "  ${YELLOW}⚠ Aetherix not found at $AETHERIX_DIR${NC}"
fi
echo ""

# ── [7] ARIA Agent (port 8088) ────────────────────────────────────────────────
echo -e "${CYAN}[7/9] Starting ARIA Agent (port 8088)...${NC}"
ARIA_DIR="$ROOT_DIR/aria"
if [ -f "$ARIA_DIR/main.py" ]; then
    cd "$ARIA_DIR"
    pip3 install -q -r requirements.txt 2>/dev/null
    nohup python3 main.py > "$ROOT_DIR/logs/aria.log" 2>&1 &
    echo -e "  PID: $!"
    sleep 3
    if curl -s http://localhost:8088/ >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ ARIA online${NC}"
    else
        echo -e "  ${YELLOW}⚠ ARIA starting (check logs/aria.log)${NC}"
    fi
    cd "$ROOT_DIR"
else
    echo -e "  ${YELLOW}⚠ ARIA not found at $ARIA_DIR${NC}"
fi
echo ""

# ── [8] Control Plane Compilers (port 8084) ───────────────────────────────────
echo -e "${CYAN}[8/9] Starting Control Plane Compilers (port 8084)...${NC}"
CPC_DIR="$ROOT_DIR/control-plane-compilers"
if [ -f "$CPC_DIR/setup.py" ]; then
    cd "$CPC_DIR"
    pip3 install -q -e . 2>/dev/null
    echo -e "  ${GREEN}✓ Control Plane Compilers installed (importable as library)${NC}"
    cd "$ROOT_DIR"
else
    echo -e "  ${YELLOW}⚠ Control Plane Compilers not found${NC}"
fi
echo ""

# ── [9] Sovereign Agentic Core (port 8081) ────────────────────────────────────
echo -e "${CYAN}[9/9] Starting Sovereign Agentic Core (port 8081)...${NC}"
SAC_DIR="$ROOT_DIR/sovereign-agentic-core"
if [ -f "$SAC_DIR/main.py" ]; then
    cd "$SAC_DIR"
    nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8081 \
        > "$ROOT_DIR/logs/sovereign-core.log" 2>&1 &
    echo -e "  PID: $!"
    sleep 4
    if curl -s http://localhost:8081/ >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Sovereign Agentic Core online${NC}"
    else
        echo -e "  ${YELLOW}⚠ Sovereign Core starting (check logs/sovereign-core.log)${NC}"
    fi
    cd "$ROOT_DIR"
else
    echo -e "  ${YELLOW}⚠ Sovereign Agentic Core not found${NC}"
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
check_port "  Tool Registry"         8000 "/api/tools/registry"
check_port "AI Lobby"                8006 "/"
check_port "Minimax AI"              8080 "/"
check_port "Sovereign Agentic Core"  8081 "/"
check_port "Aetherix Browser OS"     8086 "/"
check_port "ARIA Agent"              8088 "/"

echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  Logs:  tail -f logs/reactor.log  |  tail -f logs/lobby.log    ║"
echo "║  Stop:  ./stop-all.sh                                           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Access Lumenis: http://localhost:8000/lumenis-chat${NC}"
echo ""
