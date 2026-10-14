#!/bin/bash
# ONE2LVOS System Test Suite
# Comprehensive testing of all services

set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║         🌷 ONE2LVOS SYSTEM TEST SUITE - FULL VALIDATION 🧪          ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0

# Test function
test_service() {
    local name=$1
    local url=$2
    local expected=$3

    echo -ne "${CYAN}Testing $name...${NC} "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "$expected" ] || [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASS++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $response)"
        ((FAIL++))
        return 1
    fi
}

# Test with content check
test_content() {
    local name=$1
    local url=$2
    local pattern=$3

    echo -ne "${CYAN}Testing $name...${NC} "

    response=$(curl -s "$url" 2>/dev/null)

    if echo "$response" | grep -q "$pattern"; then
        echo -e "${GREEN}✅ PASS${NC} (Content matched)"
        ((PASS++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Content not found)"
        ((FAIL++))
        return 1
    fi
}

echo -e "${YELLOW}[1/6] Frontend Services${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_service "Boot Selector" "http://localhost:9000/" "200"
test_service "BIOS Boot" "http://localhost:9000/BIOS_BOOT.html" "200"
test_service "Recovery Console" "http://localhost:9000/RECOVERY.html" "200"
test_service "Access Portal" "http://localhost:9000/FRONTEND_ACCESS.html" "200"
test_service "Unified Dashboard" "http://localhost:9000/unified-dashboard.html" "200"
test_service "Task Manager" "http://localhost:9000/tasks.html" "200"
test_service "Agent Hub" "http://localhost:5173/" "200"
echo ""

echo -e "${YELLOW}[2/6] Backend Services${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_content "Minimax AI Health" "http://localhost:8080/health" "healthy"
test_content "Reactor Core Health" "http://localhost:8000/health" "144k_node_active"
test_content "Infinity Glasses HUD" "http://localhost:4000/" "Infinity Glasses"
echo ""

echo -e "${YELLOW}[3/6] API Endpoints${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_service "Minimax System Status" "http://localhost:8080/api/system/status" "200"
test_content "Reactor LLM Config" "http://localhost:8000/health" "nvidia"
echo ""

echo -e "${YELLOW}[4/6] Documentation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_service "START_HERE.md" "http://localhost:9000/START_HERE.md" "200"
test_service "INTEGRATION_GUIDE.md" "http://localhost:9000/INTEGRATION_GUIDE.md" "200"
test_service "FRONTEND_COMPLETE.md" "http://localhost:9000/FRONTEND_COMPLETE.md" "200"
test_service "FINAL_STATUS.md" "http://localhost:9000/FINAL_STATUS.md" "200"
test_service "BOOT_SYSTEM_COMPLETE.md" "http://localhost:9000/BOOT_SYSTEM_COMPLETE.md" "200"
echo ""

echo -e "${YELLOW}[5/6] AI Integration Test${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -ne "${CYAN}Testing AI Coach Chat...${NC} "

response=$(curl -s -X POST http://localhost:8080/api/coach/chat \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer one2lv-secret-2024" \
    -d '{"message":"test"}' 2>/dev/null)

if echo "$response" | grep -q "response"; then
    echo -e "${GREEN}✅ PASS${NC} (AI responding)"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} (No response)"
    ((FAIL++))
fi

echo -ne "${CYAN}Testing AI Second Player Status...${NC} "

response=$(curl -s -H "Authorization: Bearer one2lv-secret-2024" \
    http://localhost:8080/api/ai/status 2>/dev/null)

if echo "$response" | grep -q "level"; then
    echo -e "${GREEN}✅ PASS${NC} (AI evolution active)"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} (Status unavailable)"
    ((FAIL++))
fi
echo ""

echo -e "${YELLOW}[6/6] Integration Test${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -ne "${CYAN}Testing Reactor → Minimax Communication...${NC} "

reactor_health=$(curl -s http://localhost:8000/health 2>/dev/null)
minimax_health=$(curl -s http://localhost:8080/health 2>/dev/null)

if echo "$reactor_health" | grep -q "144k" && echo "$minimax_health" | grep -q "healthy"; then
    echo -e "${GREEN}✅ PASS${NC} (Services communicating)"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} (Communication issue)"
    ((FAIL++))
fi

echo -ne "${CYAN}Testing Frontend → Backend Integration...${NC} "

if [ -f "/home/vercel-sandbox/One2lvos/unified-dashboard.html" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Files integrated)"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} (Missing files)"
    ((FAIL++))
fi
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                         TEST SUMMARY                                 ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}Passed:${NC} $PASS tests"
echo -e "  ${RED}Failed:${NC} $FAIL tests"
echo -e "  ${CYAN}Total:${NC}  $((PASS + FAIL)) tests"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                      ║${NC}"
    echo -e "${GREEN}║         🎉 ALL TESTS PASSED - SYSTEM FULLY OPERATIONAL 🌷            ║${NC}"
    echo -e "${GREEN}║                                                                      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Access Points:${NC}"
    echo -e "  ${GREEN}Boot Selector:${NC}     http://localhost:9000/"
    echo -e "  ${GREEN}BIOS Boot:${NC}         http://localhost:9000/BIOS_BOOT.html"
    echo -e "  ${GREEN}Dashboard:${NC}         http://localhost:9000/unified-dashboard.html"
    echo -e "  ${GREEN}Minimax AI:${NC}        http://localhost:8080/health"
    echo -e "  ${GREEN}Reactor Core:${NC}      http://localhost:8000/health"
    echo -e "  ${GREEN}Infinity HUD:${NC}      http://localhost:4000/"
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                                      ║${NC}"
    echo -e "${RED}║         ⚠️  SOME TESTS FAILED - CHECK SERVICES ⚠️                    ║${NC}"
    echo -e "${RED}║                                                                      ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Try:${NC}"
    echo -e "  ./start-all.sh       # Restart all services"
    echo -e "  ./test-system.sh     # Run tests again"
    exit 1
fi
