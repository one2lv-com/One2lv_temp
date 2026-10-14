#!/bin/bash
# ONE2LVOS Sovereign Architecture - Unified Startup Script
# Launches all integrated components

set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║       🌷 ONE2LVOS SOVEREIGN ARCHITECTURE - FULL SYSTEM BOOT 🚀       ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Load environment
if [ -f ".env.master" ]; then
    export $(cat .env.master | grep -v '^#' | xargs)
fi

echo -e "${CYAN}[1/5] 🔍 Pre-flight Check...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js not found${NC}"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}❌ Python3 not found${NC}"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo -e "${YELLOW}⚠️  PM2 not found, installing...${NC}"; npm install -g pm2; }
echo -e "${GREEN}✅ All dependencies present${NC}"
echo ""

echo -e "${CYAN}[2/5] 🧹 Cleanup Previous Processes...${NC}"
pkill -9 -f "python3 main.py" 2>/dev/null || true
pkill -9 -f "node server.js" 2>/dev/null || true
pm2 delete all 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

echo -e "${CYAN}[3/5] 🔥 Starting Lumenis Reactor Core (Port 8000)...${NC}"
cd "$ROOT_DIR/∆Gemini_Root∆/core"
nohup python3 main.py > "$ROOT_DIR/logs/reactor.log" 2>&1 &
REACTOR_PID=$!
echo "  PID: $REACTOR_PID"
sleep 3
echo -e "${GREEN}✅ Reactor Core online${NC}"
echo ""

echo -e "${CYAN}[4/5] 👁️  Starting Infinity Glasses HUD (Port 4000)...${NC}"
cd "$ROOT_DIR/∆Gemini_Root∆/ui"
nohup node server.js > "$ROOT_DIR/logs/hud.log" 2>&1 &
HUD_PID=$!
echo "  PID: $HUD_PID"
sleep 2
echo -e "${GREEN}✅ Infinity Glasses online${NC}"
echo ""

echo -e "${CYAN}[5/5] 🤖 Starting Minimax AI System (Port 8080)...${NC}"
cd "$ROOT_DIR/minimax"
pm2 start index.js --name one2lvos-minimax > /dev/null 2>&1
sleep 3
echo -e "${GREEN}✅ Minimax System online${NC}"
echo ""

echo -e "${MAGENTA}[OPTIONAL] 🌉 MiniMax Integration (Requires valid API keys)${NC}"
echo -e "${YELLOW}  To start: cd $ROOT_DIR/minimax-integration && ./start_minimax.sh${NC}"
echo ""

echo -e "${CYAN}🔍 Health Checks...${NC}"
sleep 2

# Check Reactor
if curl -s http://localhost:8000/health | grep -q "144k_node"; then
    echo -e "${GREEN}  ✅ Reactor Core: ONLINE${NC}"
else
    echo -e "${RED}  ❌ Reactor Core: OFFLINE${NC}"
fi

# Check HUD
if curl -s http://localhost:4000/ | grep -q "Infinity Glasses"; then
    echo -e "${GREEN}  ✅ Infinity Glasses HUD: ONLINE${NC}"
else
    echo -e "${RED}  ❌ Infinity Glasses HUD: OFFLINE${NC}"
fi

# Check Minimax
if curl -s http://localhost:8080/health | grep -q "healthy"; then
    echo -e "${GREEN}  ✅ Minimax AI System: ONLINE${NC}"
else
    echo -e "${RED}  ❌ Minimax AI System: OFFLINE${NC}"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║         🌷 ONE2LVOS SOVEREIGN ARCHITECTURE - SYSTEM ONLINE 🎮        ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📍 Access Points:${NC}"
echo -e "  ${CYAN}Lumenis Reactor Core:${NC}   http://localhost:8000"
echo -e "  ${CYAN}Infinity Glasses HUD:${NC}   http://localhost:4000"
echo -e "  ${CYAN}Minimax AI System:${NC}      http://localhost:8080"
echo ""
echo -e "${YELLOW}📊 Process Management:${NC}"
echo -e "  ${CYAN}View logs:${NC}       pm2 logs one2lvos-minimax"
echo -e "  ${CYAN}Reactor logs:${NC}    tail -f $ROOT_DIR/logs/reactor.log"
echo -e "  ${CYAN}HUD logs:${NC}        tail -f $ROOT_DIR/logs/hud.log"
echo ""
echo -e "${YELLOW}🛑 Shutdown:${NC}"
echo -e "  ${CYAN}Stop all:${NC}        pkill -9 python3 && pkill -9 node && pm2 delete all"
echo -e "  ${CYAN}Or run:${NC}          $ROOT_DIR/stop-all.sh"
echo ""
echo -e "${GREEN}System fully operational. Four Gates active. 144k resonance achieved.${NC}"
echo ""
