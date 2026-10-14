#!/bin/bash
# ONE2LVOS Frontend Launcher

set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║          🌷 ONE2LVOS FRONTEND SUITE - LAUNCHING 🎨                   ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Create logs directory
mkdir -p logs

echo -e "${CYAN}[1/3] 🎯 Starting Unified Dashboard (Port 9000)...${NC}"
python3 -m http.server 9000 --directory . > logs/dashboard.log 2>&1 &
DASHBOARD_PID=$!
sleep 2
echo -e "${GREEN}  ✅ Dashboard: http://localhost:9000/unified-dashboard.html${NC}"
echo ""

echo -e "${CYAN}[2/3] 📋 Starting Task Manager (Port 9000)...${NC}"
echo -e "${GREEN}  ✅ Tasks: http://localhost:9000/tasks.html${NC}"
echo ""

echo -e "${CYAN}[3/3] 🎮 Starting Agent Hub (Port 5173)...${NC}"
cd "$ROOT_DIR/minimax/agent-hub"
npm run dev > "$ROOT_DIR/logs/agent-hub.log" 2>&1 &
AGENT_HUB_PID=$!
sleep 5
echo -e "${GREEN}  ✅ Agent Hub: http://localhost:5173${NC}"
echo ""

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║              🌷 ONE2LVOS FRONTEND SUITE ONLINE 🎨                    ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📍 Access Points:${NC}"
echo -e "  ${CYAN}Unified Dashboard:${NC}  http://localhost:9000/unified-dashboard.html"
echo -e "  ${CYAN}Task Manager:${NC}       http://localhost:9000/tasks.html"
echo -e "  ${CYAN}Agent Hub:${NC}          http://localhost:5173"
echo ""
echo -e "${YELLOW}🔗 Backend Services:${NC}"
echo -e "  ${CYAN}Minimax AI:${NC}         http://localhost:8080"
echo -e "  ${CYAN}Lumenis Reactor:${NC}    http://localhost:8000"
echo -e "  ${CYAN}Infinity Glasses:${NC}   http://localhost:4000"
echo ""
echo -e "${YELLOW}📊 View Logs:${NC}"
echo -e "  ${CYAN}Dashboard:${NC}  tail -f $ROOT_DIR/logs/dashboard.log"
echo -e "  ${CYAN}Agent Hub:${NC}  tail -f $ROOT_DIR/logs/agent-hub.log"
echo ""
echo -e "${YELLOW}🛑 Shutdown:${NC}"
echo -e "  pkill -9 -f \"http.server\" && pkill -9 -f \"vite\""
echo ""
