#!/bin/bash

# ============================================================================
# Lumenis Reactor Core - Startup Script
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║           🔥 Lumenis Reactor Core - Startup 🔥                 ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Check if we're in the One2lvos directory
if [ ! -f "lumenis-main.py" ]; then
    echo -e "${RED}❌ Error: lumenis-main.py not found${NC}"
    echo "Please run this script from the One2lvos directory"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ Loading .env file...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
elif [ -f ".env.master" ]; then
    echo -e "${YELLOW}⚠️  No .env file found, using .env.master${NC}"
    export $(cat .env.master | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ No environment file found!${NC}"
    echo "Please create .env or .env.master with required keys"
    exit 1
fi

# Check for required environment variables
echo ""
echo -e "${CYAN}🔍 Checking environment variables...${NC}"

if [ -z "$NVIDIA_API_KEY" ] || [ "$NVIDIA_API_KEY" = "your_nvidia_api_key_here" ]; then
    echo -e "${RED}❌ NVIDIA_API_KEY not set or invalid${NC}"
    echo "Please set your NVIDIA API key in .env"
    echo "Get your key from: https://build.nvidia.com/explore/discover"
    exit 1
else
    echo -e "${GREEN}✓ NVIDIA_API_KEY configured${NC}"
fi

echo -e "${GREEN}✓ Reactor fully powered by NVIDIA (Anthropic not required)${NC}"

if [ -z "$ASTRA_DB_API_ENDPOINT" ]; then
    echo -e "${YELLOW}⚠️  ASTRA_DB_API_ENDPOINT not set${NC}"
else
    echo -e "${GREEN}✓ ASTRA_DB_API_ENDPOINT configured${NC}"
fi

# Check Python dependencies
echo ""
echo -e "${CYAN}🔍 Checking Python dependencies...${NC}"

MISSING_DEPS=()

python3 -c "import fastapi" 2>/dev/null || MISSING_DEPS+=("fastapi")
python3 -c "import uvicorn" 2>/dev/null || MISSING_DEPS+=("uvicorn")
python3 -c "import httpx" 2>/dev/null || MISSING_DEPS+=("httpx")
python3 -c "import aiofiles" 2>/dev/null || MISSING_DEPS+=("aiofiles")

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing dependencies: ${MISSING_DEPS[*]}${NC}"
    echo -e "${CYAN}Installing missing dependencies...${NC}"
    pip install "${MISSING_DEPS[@]}" || {
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    }
fi

echo -e "${GREEN}✓ All dependencies installed${NC}"

# Check for secure connect bundle
if [ ! -f "secure-connect-one2lvos.zip" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Astra DB secure connect bundle not found${NC}"
    echo "This is optional but recommended for Cassandra driver usage"
    echo "Download from: https://astra.datastax.com"
fi

# Create logs directory
mkdir -p logs

# Start the reactor
echo ""
echo -e "${MAGENTA}🚀 Starting Lumenis Reactor Core...${NC}"
echo -e "${CYAN}   Model: Claude Opus 4.6${NC}"
echo -e "${CYAN}   Temperature: 0.18 (Thermal Baseline)${NC}"
echo -e "${CYAN}   Pulse: 73ms (≈13.7 Hz)${NC}"
echo -e "${CYAN}   Port: 3002${NC}"
echo ""

# Start with auto-reload for development
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${GREEN}Starting in PRODUCTION mode...${NC}"
    python3 lumenis-main.py 2>&1 | tee logs/lumenis-reactor.log
else
    echo -e "${YELLOW}Starting in DEVELOPMENT mode (with auto-reload)...${NC}"
    uvicorn lumenis-main:app --host 0.0.0.0 --port 3002 --reload 2>&1 | tee logs/lumenis-reactor.log
fi
